import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function WalletConnection() {
  const { connected, publicKey } = useWallet();

  return (
    <div className="flex items-center gap-4">
      {connected && publicKey && (
        <div className="hidden sm:block px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">
            Connected: <span className="text-cyan-400 font-mono">{publicKey.toString().slice(0, 8)}...</span>
          </p>
        </div>
      )}
      <WalletMultiButtonDynamic style={{ backgroundColor: '#0891b2', borderRadius: '0.375rem' }} />
    </div>
  );
}
