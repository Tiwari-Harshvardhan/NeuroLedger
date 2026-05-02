'use client';

import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

console.log('[WalletProviderWrapper] Client component module loaded');

interface WalletProviderWrapperProps {
  children: React.ReactNode;
}

export default function WalletProviderWrapper({ children }: WalletProviderWrapperProps) {
  console.log('[WalletProviderWrapper] Component rendering');

  // Use localhost for local development, Devnet for production
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const endpoint = useMemo(() => {
    console.log('[WalletProviderWrapper] Computing endpoint');
    if (isLocalhost) {
      console.log('[WalletProviderWrapper] Using local validator endpoint');
      return 'http://127.0.0.1:8899';
    }
    console.log('[WalletProviderWrapper] Using Devnet endpoint');
    return clusterApiUrl(WalletAdapterNetwork.Devnet);
  }, [isLocalhost]);

  const wallets = useMemo(() => {
    console.log('[WalletProviderWrapper] Creating wallet adapters');
    try {
      const adapters = [new PhantomWalletAdapter()];
      console.log('[WalletProviderWrapper] Wallet adapters created successfully');
      return adapters;
    } catch (error) {
      console.error('[WalletProviderWrapper] Error creating wallet adapters:', error);
      return [];
    }
  }, []);

  console.log('[WalletProviderWrapper] Rendering providers');

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}