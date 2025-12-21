import cv2
import numpy as np
import tensorflow as tf
import os

def generate_gradcam(model, img_path, output_path, target_size=(128, 128), last_conv_layer_name="conv2d_1"):
    # Load image and preprocess
    original_img = cv2.imread(img_path)
    if original_img is None:
        raise ValueError("Failed to load image for Grad-CAM")

    img_resized = cv2.resize(original_img, target_size)
    img_array = np.expand_dims(img_resized.astype('float32') / 255.0, axis=0)

    if model.input_shape[-1] == 1:
        img_array = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        img_array = np.expand_dims(img_array, axis=-1)
        img_array = np.expand_dims(img_array, axis=0)

    # Create grad model
    grad_model = tf.keras.models.Model(
        inputs=model.input,
        outputs=[model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        pred_index = tf.argmax(predictions[0])
        loss = predictions[:, pred_index]

    grads = tape.gradient(loss, conv_outputs)[0]
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1))
    conv_outputs = conv_outputs[0]

    heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs), axis=-1).numpy()
    heatmap = np.maximum(heatmap, 0)
    heatmap /= np.max(heatmap + 1e-6)  # Normalize and avoid division by zero

    # Resize and apply heatmap
    heatmap = cv2.resize(heatmap, target_size)
    heatmap = np.uint8(255 * heatmap)
    heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    superimposed_img = cv2.addWeighted(img_resized, 0.6, heatmap_color, 0.4, 0)

    # Save output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, superimposed_img)

    return output_path
