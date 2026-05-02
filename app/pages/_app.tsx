import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

import '../styles/solana-wallet-adapter.css';
import '../styles/globals.css';

console.log('[_app.tsx] Server-side module initialization');

const WalletProviderWrapperDynamic = dynamic(
  () => import('../components/WalletProviderWrapper'),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('[_app.tsx] Component mounted on client');
    setMounted(true);
  }, []);

  console.log(`[_app.tsx] Rendering App. Mounted: ${mounted}`);

  if (!mounted) {
    return (
      <div className="ssr-placeholder">
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <WalletProviderWrapperDynamic>
      <Component {...pageProps} />
    </WalletProviderWrapperDynamic>
  );
}

export default MyApp;
