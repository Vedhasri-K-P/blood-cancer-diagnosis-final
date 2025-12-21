# backend/stage_predictor.py
import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model

model = tf.keras.models.load_model("models/progression_model001.h5")

label_map = {'benign': 0, 'early': 1, 'pre': 2, 'pro': 3}
class_names = {v: k for k, v in label_map.items()}

def get_stage(class_name):
    return {'benign': 0, 'early': 1, 'pre': 2, 'pro': 3}.get(class_name, -1)

def predict_stage(img_path, target_size=(128, 128), last_conv_layer_name="last_conv"):
    img = cv2.imread(img_path)
    img_resized = cv2.resize(img, target_size)
    img_input = np.expand_dims(img_resized / 255.0, axis=0)

    grad_model = Model(
        inputs=model.input,
        outputs=[model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_input)
        pred_index = tf.argmax(predictions[0])
        loss = predictions[:, pred_index]

    grads = tape.gradient(loss, conv_outputs)[0]
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1))
    conv_outputs = conv_outputs[0]
    heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs), axis=-1).numpy()
    heatmap = np.maximum(heatmap, 0)
    heatmap /= np.max(heatmap)

    pred_class = class_names[pred_index.numpy()]
    confidence = float(predictions[0][pred_index.numpy()])
    stage = get_stage(pred_class)

    return {
        "stage": stage,
        "stage_label": pred_class,
        "confidence": round(confidence * 100, 2)
    }
