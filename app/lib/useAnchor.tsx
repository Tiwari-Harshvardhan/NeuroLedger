'use client';

import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import idlData from '../neuro_ledger.json';

const PROGRAM_ID = 'AUB5zFoihMKGSJJudCBFPUKGVMgBW6QAcwMZbTPWkQxW';

console.log('[useAnchor] Hook module loaded');

// Use any to bypass all deep type checks for the IDL
const idl = idlData as any;

export const useAnchor = () => {
  console.log('[useAnchor] Hook invoked');
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    console.log('[useAnchor] Computing provider. Wallet publicKey:', wallet.publicKey?.toString());
    if (!wallet.publicKey) return null;
    return new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) {
      console.log('[useAnchor] No provider, skipping program initialization');
      return null;
    }
    console.log('[useAnchor] Initializing Program with IDL');
    try {
      return new Program(idl, provider);
    } catch (error) {
      console.error('[useAnchor] Error initializing Program:', error);
      return null;
    }
  }, [provider]);

  return { provider, program };
};
