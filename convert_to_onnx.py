#!/usr/bin/env python3
"""
Robust script to convert scikit-learn model (model.pkl) to ONNX format.
This script includes comprehensive error handling and validation.
"""

import pickle
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

def main():
    print("🔄 Starting ONNX conversion process...")

    # 1. Load the model with robust error handling
    model_path = 'model.pkl'
    try:
        with open(model_path, 'rb') as f:
            clf = pickle.load(f)
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return

    # Check if model is valid
    if clf is None:
        print("❌ Error: The loaded model is None. Check your model.pkl file.")
        return

    # Check if model has predict method
    if not hasattr(clf, 'predict'):
        print("❌ Error: The loaded object is not a valid scikit-learn model (missing predict method).")
        return

    print("✅ Model loaded successfully!")
    print(f"📊 Model type: {type(clf).__name__}")

    # 2. Define input types (2 features: CGPA and IQ)
    # FloatTensorType([None, 2]) means:
    # - None: variable batch size
    # - 2: number of features (CGPA, IQ)
    initial_type = [('float_input', FloatTensorType([None, 2]))]

    print("🔧 Defined input types: 2 features (CGPA, IQ)")

    # 3. Convert to ONNX
    print("⚙️ Converting model to ONNX format...")
    try:
        onx = convert_sklearn(clf, initial_types=initial_type)

        # Save the ONNX model
        output_path = "model.onnx"
        with open(output_path, "wb") as f:
            f.write(onx.SerializeToString())

        print("✅ Model converted to model.onnx successfully!")
        print(f"📁 Output saved to: {output_path}")

        # Print some model information
        print("📋 ONNX Model Information:")
        print(f"   - Input name: float_input")
        print(f"   - Input shape: [None, 2] (batch_size, features)")
        print(f"   - Features: CGPA, IQ")
        print(f"   - Output: Prediction (0=Not Placed, 1=Placed)")

    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        print("💡 Troubleshooting tips:")
        print("   - Ensure your model is a supported scikit-learn estimator")
        print("   - Check that the model was trained properly")
        print("   - Verify the input features match the expected format")

if __name__ == "__main__":
    main()