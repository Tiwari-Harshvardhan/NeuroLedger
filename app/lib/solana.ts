import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

// Convert hex or base64 string to Uint8Array
export function parseProofInput(input: string): Uint8Array {
  // Try base64 first
  try {
    if (input.includes('+') || input.includes('/') || input.includes('=')) {
      return new Uint8Array(Buffer.from(input, 'base64'));
    }
  } catch (e) {
    // Not base64, try hex
  }

  // Try hex
  try {
    if (input.startsWith('0x')) {
      return new Uint8Array(Buffer.from(input.slice(2), 'hex'));
    } else {
      return new Uint8Array(Buffer.from(input, 'hex'));
    }
  } catch (e) {
    throw new Error('Invalid proof format. Please provide hex or base64 encoded data.');
  }
}

// Generate a simple proof for testing (in production, this would use arkworks/bellman)
export function generateMockProof(): Uint8Array {
  const proofData = new Uint8Array(256);
  // Fill with pseudo-random data
  for (let i = 0; i < proofData.length; i++) {
    proofData[i] = Math.floor(Math.random() * 256);
  }
  return proofData;
}

// Main function to submit prediction
export async function submitPrediction(
  connection: Connection,
  userPublicKey: PublicKey,
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>,
  predictionData: string,
  proofData: string
): Promise<string> {
  // Parse inputs
  let proof: Uint8Array;
  let publicInputs: Uint8Array;

  try {
    proof = parseProofInput(proofData);
    publicInputs = parseProofInput(predictionData);
  } catch (error) {
    throw new Error(`Failed to parse proof or prediction data: ${error}`);
  }

  // For this test, we'll create a simple transaction structure
  // In production, you'd use the Anchor client to call the verify_and_reward instruction
  
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'AUB5zFoihMKGSJJudCBFPUKGVMgBW6QAcwMZbTPWkQxW');

  // Create a simple transaction that interacts with your program
  const transaction = new Transaction();

  // This is a placeholder - in the next step we'll fully wire this to the actual program
  // For now, we're demonstrating the structure
  const instruction = SystemProgram.transfer({
    fromPubkey: userPublicKey,
    toPubkey: userPublicKey,
    lamports: 1000, // Minimal rent for testing
  });

  transaction.add(instruction);
  transaction.feePayer = userPublicKey;

  const blockHash = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockHash.blockhash;

  // Send transaction
  const signature = await sendTransaction(transaction, connection);

  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
  });

  return signature;
}

// Helper function to get the config PDA
export function getConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('neuro_ledger_config')],
    programId
  );
}

// Helper function to get the prediction PDA
export function getPredictionPDA(
  programId: PublicKey,
  userPublicKey: PublicKey,
  proofHash: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_prediction'), userPublicKey.toBuffer(), proofHash],
    programId
  );
}
