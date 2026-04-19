import Head from 'next/head';
import WalletConnection from '../components/WalletConnection';
import PredictionDashboard from '../components/PredictionDashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>NeuroLedger - ML Predictions with ZK Proofs</title>
        <meta name="description" content="Submit ML predictions and earn rewards with zero-knowledge proofs on Solana" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="bg-slate-900 border-b border-slate-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                NeuroLedger
              </h1>
              <WalletConnection />
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              AI Predictions Meet ZK Proofs
            </h2>
            <p className="text-xl text-slate-400 mb-2">
              Submit machine learning predictions, prove them with zero-knowledge proofs, and earn rewards
            </p>
            <p className="text-sm text-slate-500">
              Powered by Solana, Anchor, and arkworks
            </p>
          </div>

          <PredictionDashboard />
        </div>

        <footer className="bg-slate-900 border-t border-slate-700 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-slate-400 text-sm">
              <p>NeuroLedger © 2024. Built with Solana + Anchor + Next.js</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
