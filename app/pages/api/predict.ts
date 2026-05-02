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
  console.log('[predict API] Request received:', new Date().toISOString());
  
  if (req.method !== 'POST') {
    console.log('[predict API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed', prediction: 0 });
  }

  try {
    const { cgpa, iq }: PredictionRequest = req.body;
    console.log('[predict API] Processing prediction for cgpa:', cgpa, 'iq:', iq);

    // Validate inputs
    if (typeof cgpa !== 'number' || typeof iq !== 'number') {
      console.log('[predict API] Invalid input types received');
      return res.status(400).json({
        error: 'Invalid input: cgpa and iq must be numbers',
        prediction: 0
      });
    }

    if (cgpa < 0 || cgpa > 10 || iq < 0 || iq > 200) {
      console.log('[predict API] Input validation failed - out of range');
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
    console.log('[predict API] Python options configured');

    // Wrap Python execution in a dedicated async function with timeout
    const executePythonWithTimeout = async (): Promise<PredictionResponse> => {
      return new Promise((resolve) => {
        console.log('[predict API] Spawning Python process');
        let isResponseSent = false;

        // Create timeout at the start
        const timeoutId = setTimeout(() => {
          console.error('[predict API] ⚠️ TIMEOUT: Python process exceeded 25s - killing process');
          if (!isResponseSent) {
            isResponseSent = true;
            try {
              pyshell.kill('SIGKILL');
            } catch (e) {
              console.error('[predict API] Error killing pyshell:', e);
            }
            resolve({
              error: 'ML model execution timed out (exceeded 25 seconds). Ensure Python dependencies are installed.',
              prediction: 0
            });
          }
        }, 25000);

        const pyshell = new PythonShell(pythonScript, options) as any;
        let result = '';
        let errorOutput = '';

        pyshell.on('message', (message: string) => {
          if (!isResponseSent) {
            console.log('[predict API] ✓ Message:', message.substring(0, 80));
            result = message;
          }
        });

        pyshell.on('stderr', (stderr: string) => {
          if (!isResponseSent) {
            console.log('[predict API] stderr:', stderr.substring(0, 80));
            errorOutput += stderr;
          }
        });

        pyshell.on('error', (err: any) => {
          console.error('[predict API] ✗ Process error:', err);
          if (!isResponseSent) {
            isResponseSent = true;
            clearTimeout(timeoutId);
            resolve({
              error: 'Failed to run ML model: ' + (err.message || String(err)),
              prediction: 0
            });
          }
        });

        pyshell.on('close', (code: number) => {
          console.log('[predict API] Closed with code:', code);
          if (!isResponseSent) {
            isResponseSent = true;
            clearTimeout(timeoutId);

            if (code !== 0) {
              console.error('[predict API] ✗ Exit code:', code);
              resolve({
                error: 'ML model failed: ' + errorOutput.substring(0, 150),
                prediction: 0
              });
              return;
            }

            try {
              const predictionResult = JSON.parse(result);
              console.log('[predict API] ✓ Success:', predictionResult);
              resolve(predictionResult);
            } catch (parseError) {
              console.error('[predict API] ✗ Parse failed:', result.substring(0, 50));
              resolve({
                error: 'Failed to parse output',
                prediction: 0
              });
            }
          }
        });

        pyshell.send(JSON.stringify({ cgpa, iq }));
        pyshell.end();
      });
    };

    const result = await executePythonWithTimeout();
    return res.status(result.error ? 500 : 200).json(result);

  } catch (error) {
    console.error('[predict API] Error in validation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      prediction: 0
    });
  }
}