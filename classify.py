import tensorflow as tf
import numpy as np
import cv2
import os
import traceback # Import traceback
import uuid # <--- ADD THIS LINE TO FIX THE ERROR

from gradcam import generate_gradcam

# Load model once globally
try:
    model = tf.keras.models.load_model('models/new_classifier_model.h5')
    print("--- Model loaded successfully ---")
except Exception as e:
    print(f"--- FATAL ERROR: Could not load model 'models/new_classifier_model.h5': {e} ---")
    model = None 

# Label map (keep your existing order)
label_map = {0: 'ALL', 1: 'AML', 2: 'CLL', 3: 'CML', 4: 'Myeloma', 5: 'Normal'}

# Explanations (lowercase keys to match label_map values)
explanation_dict = {
    "ALL": "Acute Lymphoblastic Leukemia: Immature lymphoid cells rapidly increase in number.",
    "AML": "Acute Myeloid Leukemia: Excessive immature myeloid cells in bone marrow and blood.",
    "CLL": "Chronic Lymphocytic Leukemia: Slow-growing cancer of lymphoid cells, typically in older adults.",
    "CML": "Chronic Myeloid Leukemia: Uncontrolled growth of myeloid cells, associated with Philadelphia chromosome.",
    "Myeloma": "Multiple Myeloma: Cancer of plasma cells affecting bone marrow and leading to bone lesions.",
    "Normal": "Healthy blood smear with no signs of abnormal white blood cell proliferation."
}

# --------- Heuristic validator (no changes needed here) ---------
def _image_entropy(gray):
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).ravel()
    p = hist / (np.sum(hist) + 1e-8); nz = p[p > 0]
    if nz.size == 0: return 0.0
    return float(-np.sum(nz * np.log2(nz)))

def _validate_blood_smear(img_bgr):
    if img_bgr is None or img_bgr.size == 0: return False, "Unreadable image."
    small = cv2.resize(img_bgr, (256, 256), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV); gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    white_mask = (hsv[..., 2] > 230) & (hsv[..., 1] < 30); white_frac = float(np.mean(white_mask))
    lower_purple = np.array([120, 40, 40]); upper_purple = np.array([170, 255, 255])
    purple_mask = cv2.inRange(hsv, lower_purple, upper_purple) > 0; purple_frac = float(np.mean(purple_mask))
    edges = cv2.Canny(gray, 80, 160); edge_frac = float(np.mean(edges > 0))
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    circles = cv2.HoughCircles(blur, cv2.HOUGH_GRADIENT, dp=1.2, minDist=14, param1=60, param2=18, minRadius=4, maxRadius=30)
    circle_count = 0 if circles is None else circles.shape[1]
    ent = _image_entropy(gray)
    if white_frac > 0.65 and purple_frac < 0.005 and edge_frac < 0.03: return False, "Looks like document/diagram."
    if float(np.mean(hsv[..., 1])) < 20 and ent < 3.2: return False, "Appears grayscale/low-detail."
    smear_cues = sum([purple_frac > 0.01, edge_frac > 0.04 and white_frac < 0.6, circle_count >= 5])
    if smear_cues == 0: return False, "Does not resemble a blood smear."
    return True, ""


def preprocess_image(image_path, target_size=(128, 128)):
    img = cv2.imread(image_path)
    if img is None: raise ValueError(f"Image not found or unreadable at path: {image_path}")
    img = cv2.resize(img, target_size)
    img = img.astype('float32') / 255.0
    if model is not None and model.input_shape[-1] == 1: 
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = np.expand_dims(img, axis=-1)
    return np.expand_dims(img, axis=0)

def predict_disease(image_path):
    print(f"\n--- classify.py: Starting prediction for {os.path.basename(image_path)} ---") 

    # --- Model Loading Check ---
    if model is None:
        print("--- classify.py: ERROR - Model is not loaded. Cannot predict. ---")
        return {"invalid": True, "error": "Model loading failed.", "detail": "Prediction model not loaded."}
        
    # --- Validation ---
    try:
        original = cv2.imread(image_path)
        is_valid, reason = _validate_blood_smear(original)
        if not is_valid:
            print(f"--- classify.py: Image invalid: {reason} ---")
            return {"invalid": True, "error": "Invalid Image", "detail": reason}
    except Exception as e:
        print(f"--- classify.py: ERROR during image validation: {e} ---")
        return {"invalid": True, "error": "Validation Error", "detail": f"Could not validate image: {e}"}

    # --- Prediction ---
    try:
        print("--- classify.py: Preprocessing image... ---")
        img_input = preprocess_image(image_path)
        print("--- classify.py: Running model prediction... ---")
        prediction = model.predict(img_input)[0]
        predicted_class = int(np.argmax(prediction))
        confidence = float(prediction[predicted_class]) * 100.0 
        class_name = label_map.get(predicted_class, "Unknown Class") 
        explanation = explanation_dict.get(class_name, "No explanation available.")
        print(f"--- classify.py: Prediction: {class_name} ({confidence:.2f}%) ---")
    except Exception as e:
        print(f"--- classify.py: ERROR during prediction: {e} ---")
        traceback.print_exc() 
        return {"error": "Prediction Failed", "detail": f"Error during model prediction: {e}"}

    # --- Grad-CAM Generation ---
    gradcam_path_rel = "" # Initialize default
    try:
        filename = os.path.basename(image_path)
        safe_filename = "".join(c for c in filename if c.isalnum() or c in ['.', '_', '-']).strip()
        if not safe_filename: safe_filename = "gradcam_image.jpg" 
        
        # Use uuid now that it's imported
        gradcam_filename = f"gradcam_{uuid.uuid4().hex}_{safe_filename}" 
        gradcam_path_rel = os.path.join("static", "outputs", "gradcam", gradcam_filename).replace(os.sep, '/')
        gradcam_path_abs = os.path.abspath(os.path.join(os.path.dirname(__file__), gradcam_path_rel))
        
        os.makedirs(os.path.dirname(gradcam_path_abs), exist_ok=True)
        print(f"--- classify.py: Generating Grad-CAM at {gradcam_path_abs} ---")

        # !!! DOUBLE CHECK THIS LAYER NAME !!! 
        last_conv_layer_name="conv2d_1" 
        try: model.get_layer(last_conv_layer_name)
        except ValueError: raise ValueError(f"Layer '{last_conv_layer_name}' not found.") 

        generate_gradcam(
            model, image_path, gradcam_path_abs, target_size=(128, 128), 
            last_conv_layer_name=last_conv_layer_name 
        )
        if os.path.exists(gradcam_path_abs):
             print(f"--- classify.py: Grad-CAM generated successfully: {gradcam_path_rel} ---")
        else:
             print(f"--- classify.py: ERROR - generate_gradcam ran but file not found at {gradcam_path_abs} ---")
             gradcam_path_rel = "" 

    except Exception as e:
        print(f"--- classify.py: ERROR during Grad-CAM generation: {e} ---")
        traceback.print_exc() 
        gradcam_path_rel = "" # Ensure path is empty on error

    # --- Return Results ---
    result = {
        "class_name": class_name,
        "confidence": confidence, # e.g., 99.5
        "explanation": explanation,
        "gradcam_url": gradcam_path_rel  # Return relative path 'static/outputs/gradcam/...'
    }
    print(f"--- classify.py: Returning result: {result} ---") 
    return result