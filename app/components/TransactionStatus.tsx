'use client';

interface TransactionStatusProps {
  status: {
    status: 'idle' | 'predicting' | 'generating_proof' | 'submitting' | 'success' | 'error' | 'loading';
    message: string;
    signature?: string;
  };
}

export default function TransactionStatus({ status }: TransactionStatusProps) {
  const isSuccess = status.status === 'success';
  const isError = status.status === 'error';
  const isLoading = ['loading', 'predicting', 'generating_proof', 'submitting'].includes(status.status);
  const isIdle = status.status === 'idle';

  if (isIdle) return null;

  return (
    <div className={`border rounded-xl p-8 ${
      isSuccess ? 'bg-green-900/20 border-green-600/50' :
      isError ? 'bg-red-900/20 border-red-600/50' :
      'bg-blue-900/20 border-blue-600/50'
    }`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">
          {isSuccess ? '✅' : isError ? '❌' : '⏳'}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold text-lg mb-2 ${
            isSuccess ? 'text-green-400' :
            isError ? 'text-red-400' :
            'text-blue-400'
          }`}>
            {isSuccess ? 'Success!' : isError ? 'Error' : 'Processing...'}
          </h4>
          <p className="text-slate-300 mb-4">{status.message}</p>
          
          {status.signature && (
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Transaction Signature:</p>
              <a
                href={`https://explorer.solana.com/tx/${status.signature}?cluster=custom&customUrl=http://localhost:8899`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-mono text-sm break-all transition"
              >
                {status.signature}
              </a>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-2 mt-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
