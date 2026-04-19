#!/usr/bin/env python3
"""
Test script to verify ONNX model predictions match the original scikit-learn model.
"""

import pickle
import numpy as np
import onnxruntime as ort

def main():
    print("🧪 Testing ONNX model predictions...")

    # Load original model
    print("📂 Loading original scikit-learn model...")
    with open('model.pkl', 'rb') as f:
        clf = pickle.load(f)

    # Load ONNX model
    print("📂 Loading ONNX model...")
    session = ort.InferenceSession('model.onnx')

    # Test data (CGPA, IQ pairs)
    test_data = np.array([
        [8.5, 120],  # High CGPA, High IQ - should be placed
        [6.0, 90],   # Medium CGPA, Medium IQ - borderline
        [5.5, 85],   # Low CGPA, Low IQ - should not be placed
        [9.0, 110],  # Very high CGPA, High IQ - should be placed
        [7.2, 95],   # Good CGPA, Medium IQ - should be placed
    ], dtype=np.float32)

    print("🔍 Testing predictions on sample data:")
    print("Format: [CGPA, IQ] -> Original: prediction, ONNX: prediction")

    all_match = True
    for i, sample in enumerate(test_data):
        # Original model prediction
        original_pred = clf.predict(sample.reshape(1, -1))[0]

        # ONNX model prediction
        # Note: ONNX expects input as dict with the input name
        onnx_pred = session.run(None, {'float_input': sample.reshape(1, -1)})[0][0]

        # Convert ONNX prediction to int (it might be float)
        onnx_pred_int = int(round(onnx_pred))

        match = original_pred == onnx_pred_int
        if not match:
            all_match = False

        status = "✅" if match else "❌"
        print(f"  {status} Sample {i+1}: {sample} -> Original: {original_pred}, ONNX: {onnx_pred_int}")

    if all_match:
        print("🎉 All predictions match! ONNX conversion successful.")
    else:
        print("⚠️ Some predictions don't match. Check the conversion process.")
        return 1

    # Test with batch prediction
    print("🔍 Testing batch predictions...")
    batch_pred_original = clf.predict(test_data)
    batch_pred_onnx = session.run(None, {'float_input': test_data})[0].flatten()
    batch_pred_onnx_int = np.round(batch_pred_onnx).astype(int)

    batch_match = np.array_equal(batch_pred_original, batch_pred_onnx_int)
    if batch_match:
        print("✅ Batch predictions match!")
    else:
        print("❌ Batch predictions don't match.")
        all_match = False

    return 0 if all_match else 1

if __name__ == "__main__":
    exit(main())