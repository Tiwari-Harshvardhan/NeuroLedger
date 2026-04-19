import { NextApiRequest, NextApiResponse } from 'next';
import { PythonShell } from 'python-shell';
import path from 'path';

interface PredictionRequest {
  cgpa: number;
  iq: number;
}

interface PredictionResponse {
  prediction: number; // 0 or 1
  confidence?: number;
  error?: string;
}

// Python script to load and run the ONNX ML model
const pythonScript = `
import sys
import numpy as np
import os
import onnxruntime as ort

# Load the ONNX model
model_path = os.path.join(os.path.dirname(__file__), '../../../model.onnx')
try:
    session = ort.InferenceSession(model_path)
    print("ONNX model loaded successfully", file=sys.stderr)
except Exception as e:
    print(f"Error loading ONNX model: {e}", file=sys.stderr)
    sys.exit(1)

# Read input from stdin (JSON format)
import json
input_data = json.loads(sys.stdin.read())

# Extract features
cgpa = float(input_data['cgpa'])
iq = float(input_data['iq'])

# Make prediction using ONNX
features = np.array([[cgpa, iq]], dtype=np.float32)
try:
    result = session.run(None, {'float_input': features})
    prediction = int(round(result[0][0]))  # Extract prediction from array

    # Extract confidence from probabilities if available
    confidence = None
    if len(result) > 1 and result[1]:
        prob_dict = result[1][0]  # Get probability dictionary
        confidence = float(max(prob_dict.values()))  # Max probability as confidence

    print(f"Prediction result: {prediction}, Confidence: {confidence}", file=sys.stderr)
except Exception as e:
    print(f"Error making prediction: {e}", file=sys.stderr)
    sys.exit(1)

# Output result as JSON
result = {
    'prediction': int(prediction),
    'confidence': confidence
}
print(json.dumps(result))
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PredictionResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', prediction: 0 });
  }

  try {
    const { cgpa, iq }: PredictionRequest = req.body;

    // Validate inputs
    if (typeof cgpa !== 'number' || typeof iq !== 'number') {
      return res.status(400).json({
        error: 'Invalid input: cgpa and iq must be numbers',
        prediction: 0
      });
    }

    if (cgpa < 0 || cgpa > 10 || iq < 0 || iq > 200) {
      return res.status(400).json({
        error: 'Invalid input ranges: CGPA should be 0-10, IQ should be 0-200',
        prediction: 0
      });
    }

    // Run Python script with the model
    const options = {
      mode: 'text' as const,
      pythonPath: 'python3',
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.dirname(__filename),
      args: []
    };

    const pyshell = new PythonShell(pythonScript, options);

    return new Promise((resolve) => {
      let result = '';
      let errorOutput = '';

      pyshell.on('message', (message) => {
        result = message;
      });

      pyshell.on('stderr', (stderr) => {
        errorOutput += stderr;
      });

      pyshell.on('error', (err) => {
        console.error('Python script error:', err);
        resolve(res.status(500).json({
          error: 'Failed to run ML model',
          prediction: 0
        }));
      });

      pyshell.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script exited with code:', code, errorOutput);
          resolve(res.status(500).json({
            error: 'ML model execution failed',
            prediction: 0
          }));
          return;
        }

        try {
          const predictionResult = JSON.parse(result);
          resolve(res.status(200).json(predictionResult));
        } catch (parseError) {
          console.error('Failed to parse Python output:', result);
          resolve(res.status(500).json({
            error: 'Failed to parse model output',
            prediction: 0
          }));
        }
      });

      // Send input data to Python script
      pyshell.send(JSON.stringify({ cgpa, iq }));
      pyshell.end();
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      prediction: 0
    });
  }
}