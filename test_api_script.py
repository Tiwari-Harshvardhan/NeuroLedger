#!/usr/bin/env python3
"""
Test the ONNX prediction script directly
"""

import sys
import numpy as np
import os
import onnxruntime as ort
import json

# Load the ONNX model
model_path = os.path.join(os.getcwd(), 'model.onnx')
print(f"Loading model from: {model_path}")
try:
    session = ort.InferenceSession(model_path)
    print("ONNX model loaded successfully")
except Exception as e:
    print(f"Error loading ONNX model: {e}")
    sys.exit(1)

# Test input
input_data = {'cgpa': 8.5, 'iq': 120}

# Extract features
cgpa = float(input_data['cgpa'])
iq = float(input_data['iq'])

# Make prediction using ONNX
features = np.array([[cgpa, iq]], dtype=np.float32)
print(f"Features: {features}")
try:
    result = session.run(None, {'float_input': features})
    print(f"Raw result structure: {result}")
    print(f"Result[0] shape: {result[0].shape}")
    print(f"Result[0]: {result[0]}")

    # Extract prediction - ONNX returns a numpy array
    prediction = int(round(result[0][0]))  # Should be result[0][0] not result[0][0][0]
    print(f"Prediction result: {prediction}")
except Exception as e:
    print(f"Error making prediction: {e}")
    sys.exit(1)

# Output result as JSON
result_json = {
    'prediction': int(prediction),
    'confidence': None
}
print(json.dumps(result_json))