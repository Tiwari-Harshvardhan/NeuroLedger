import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import PredictionForm from './PredictionForm';
import TransactionStatus from './TransactionStatus';

export default function PredictionDashboard() {
  const { connected } = useWallet();
  const [transactionStatus, setTransactionStatus] = useState<{
    status: 'loading' | 'success' | 'error';
    message: string;
    signature?: string;
  } | null>(null);

  if (!connected) {
    return (
      <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl p-12 text-center">
        <p className="text-xl text-slate-400 mb-4">
          👛 Please connect your Phantom wallet to get started
        </p>
        <p className="text-sm text-slate-500">
          You'll need SOL for transaction fees and a token account to receive rewards
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <PredictionForm onStatusChange={setTransactionStatus} />
      
      {transactionStatus && (
        <TransactionStatus status={transactionStatus} />
      )}
      
      {!transactionStatus && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Dashboard</h3>
          <div className="space-y-4">
            <div className="bg-slate-700 bg-opacity-50 rounded-lg p-4">
              <p className="text-sm text-slate-400">Total Submissions</p>
              <p className="text-3xl font-bold text-cyan-400">-</p>
            </div>
            <div className="bg-slate-700 bg-opacity-50 rounded-lg p-4">
              <p className="text-sm text-slate-400">Total Rewards Earned</p>
              <p className="text-3xl font-bold text-green-400">-</p>
            </div>
            <div className="bg-slate-700 bg-opacity-50 rounded-lg p-4">
              <p className="text-sm text-slate-400">Network Status</p>
              <p className="text-sm text-slate-300 mt-2">Connected to local validator</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
