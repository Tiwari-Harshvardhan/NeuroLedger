import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchor } from '../lib/useAnchor';
import { generateZKProof, formatProofForSolana, validateZKProof, ZKProof } from '../lib/zkProof';
import { PublicKey, SystemProgram } from '@solana/web3.js';

interface PredictionFormProps {
  onStatusChange: (status: {
    status: 'idle' | 'predicting' | 'generating_proof' | 'submitting' | 'success' | 'error';
    message: string;
    signature?: string;
  } | null) => void;
}

interface PredictionResult {
  prediction: number;
  confidence?: number;
}

export default function PredictionForm({ onStatusChange }: PredictionFormProps) {
  const { publicKey } = useWallet();
  const { program } = useAnchor();

  // Form state
  const [cgpa, setCgpa] = useState<string>('');
  const [iq, setIq] = useState<string>('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCgpa('');
    setIq('');
    setPrediction(null);
    setZkProof(null);
  };

  const handlePredict = async () => {
    if (!cgpa || !iq) return;

    setLoading(true);
    onStatusChange({
      status: 'predicting',
      message: '🤖 Running ML prediction...',
    });

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cgpa: parseFloat(cgpa),
          iq: parseInt(iq),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Prediction failed');
      }

      setPrediction(result);
      onStatusChange({
        status: 'idle',
        message: `✅ Prediction: ${result.prediction === 1 ? 'Placed' : 'Not Placed'}${result.confidence ? ` (${(result.confidence * 100).toFixed(1)}% confidence)` : ''}`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      onStatusChange({
        status: 'error',
        message: `❌ Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProof = async () => {
    if (!prediction) return;

    setLoading(true);
    onStatusChange({
      status: 'generating_proof',
      message: '🔐 Generating ZK proof...',
    });

    try {
      const proof = await generateZKProof(
        { cgpa: parseFloat(cgpa), iq: parseInt(iq) },
        prediction.prediction
      );

      if (!validateZKProof(proof)) {
        throw new Error('Generated proof is invalid');
      }

      setZkProof(proof);
      onStatusChange({
        status: 'idle',
        message: '✅ ZK proof generated successfully!',
      });
    } catch (error) {
      console.error('Proof generation error:', error);
      onStatusChange({
        status: 'error',
        message: `❌ Proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToBlockchain = async () => {
    if (!program || !publicKey || !prediction || !zkProof) return;

    setLoading(true);
    onStatusChange({
      status: 'submitting',
      message: '⛓️ Submitting to blockchain...',
    });

    try {
      // Format proof data for Solana program
      const { proof, publicInputs } = formatProofForSolana(zkProof);

      // Get PDAs
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('neuro_ledger_config')],
        program.programId
      );

      const [predictionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_prediction'), publicKey.toBuffer()],
        program.programId
      );

      // Call the verifyAndReward instruction
      const tx = await program.methods
        .verifyAndReward(proof, publicInputs)
        .accounts({
          user: publicKey,
          config: configPda,
          prediction: predictionPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      onStatusChange({
        status: 'success',
        message: '🎉 Prediction verified and reward claimed!',
        signature: tx,
      });

      resetForm();
    } catch (error) {
      console.error('Blockchain submission error:', error);
      onStatusChange({
        status: 'error',
        message: `❌ Blockchain submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
      <h3 className="text-lg font-semibold text-white mb-6">🎓 ML Prediction & ZK Verification</h3>

      <div className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CGPA (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              placeholder="Enter CGPA"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              IQ Score (0-200)
            </label>
            <input
              type="number"
              min="0"
              max="200"
              value={iq}
              onChange={(e) => setIq(e.target.value)}
              placeholder="Enter IQ score"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
              required
            />
          </div>
        </div>

        {/* Predict Button */}
        <button
          type="button"
          onClick={handlePredict}
          disabled={loading || !cgpa || !iq}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:scale-100"
        >
          {loading ? '🤖 Predicting...' : '🔮 Get Prediction'}
        </button>

        {/* Prediction Result */}
        {prediction && (
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Prediction Result:</h4>
            <p className="text-cyan-400 text-lg">
              {prediction.prediction === 1 ? '✅ Placed' : '❌ Not Placed'}
              {prediction.confidence && (
                <span className="text-slate-400 text-sm ml-2">
                  ({(prediction.confidence * 100).toFixed(1)}% confidence)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Generate Proof Button */}
        {prediction && (
          <button
            type="button"
            onClick={handleGenerateProof}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:scale-100"
          >
            {loading ? '🔐 Generating Proof...' : '🛡️ Generate ZK Proof'}
          </button>
        )}

        {/* Proof Status */}
        {zkProof && (
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">ZK Proof Generated:</h4>
            <p className="text-green-400 text-sm">✅ Proof ready for blockchain submission</p>
            <details className="mt-2">
              <summary className="text-slate-400 cursor-pointer">View proof details</summary>
              <pre className="text-xs text-slate-500 mt-2 overflow-x-auto">
                {JSON.stringify({
                  proofLength: zkProof.proof.length,
                  inputsLength: zkProof.publicInputs.length,
                  hasVerificationKey: !!zkProof.verificationKey
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Submit to Blockchain Button */}
        {prediction && zkProof && (
          <button
            type="button"
            onClick={handleSubmitToBlockchain}
            disabled={loading || !publicKey}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </path>
              </svg>
                Submitting...
              </span>
            ) : (
              '⛓️ Submit to Blockchain'
            )}
          </button>
        )}

        {/* Wallet Connection Notice */}
        {!publicKey && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              ⚠️ Please connect your Phantom wallet to submit predictions to the blockchain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { submitPrediction } from '../lib/solana';

interface PredictionFormProps {
  onStatusChange: (status: {
    status: 'loading' | 'success' | 'error';
    message: string;
    signature?: string;
  } | null) => void;
}

export default function PredictionForm({ onStatusChange }: PredictionFormProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [predictionData, setPredictionData] = useState('');
  const [proofData, setProofData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      onStatusChange({
        status: 'error',
        message: 'Wallet not connected',
      });
      return;
    }

    setLoading(true);
    onStatusChange({
      status: 'loading',
      message: 'Processing your prediction...',
    });

    try {
      const signature = await submitPrediction(
        connection,
        publicKey,
        sendTransaction,
        predictionData,
        proofData
      );

      onStatusChange({
        status: 'success',
        message: 'Prediction submitted and verified! 🎉',
        signature,
      });

      setPredictionData('');
      setProofData('');
    } catch (error) {
      console.error('Error:', error);
      onStatusChange({
        status: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-8">
      <h3 className="text-lg font-semibold text-white mb-6">🤖 Submit ML Prediction</h3>

      <div className="space-y-6">
        {/* Prediction Data Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Prediction Data (Base64 or Hex)
          </label>
          <textarea
            value={predictionData}
            onChange={(e) => setPredictionData(e.target.value)}
            placeholder="Enter your ML prediction output (e.g., probabilities, class predictions)"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
            rows={4}
            required
          />
          <p className="text-xs text-slate-500 mt-2">
            This would typically be the output of your ML model (serialized as hex/base64)
          </p>
        </div>

        {/* Proof Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ZK Proof (Base64 or Hex)
          </label>
          <textarea
            value={proofData}
            onChange={(e) => setProofData(e.target.value)}
            placeholder="Enter the zero-knowledge proof"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
            rows={4}
            required
          />
          <p className="text-xs text-slate-500 mt-2">
            Generated using arkworks or bellman (serialized as hex/base64)
          </p>
        </div>

        {/* Public Inputs (optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Public Inputs (Optional, Base64 or Hex)
          </label>
          <input
            type="text"
            placeholder="Enter public inputs if your proof requires them"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
          />
          <p className="text-xs text-slate-500 mt-2">
            Public inputs that are part of your ZK proof statement
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !predictionData || !proofData}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            '✨ Submit Prediction'
          )}
        </button>
      </div>
    </form>
  );
}
