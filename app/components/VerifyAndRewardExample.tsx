// Example usage in a React component
import { useAnchor } from '../lib/useAnchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';

const VerifyAndRewardComponent = () => {
  const { program } = useAnchor();

  const handleVerifyAndReward = async (proof: Uint8Array, publicInputs: Uint8Array) => {
    if (!program) return;

    const user = program.provider.publicKey;

    // Derive config PDA
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('neuro_ledger_config')],
      program.programId
    );

    // Derive prediction PDA
    const [predictionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_prediction'), user.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods
        .verifyAndReward(proof, publicInputs)
        .accounts({
          user: user,
          config: configPda,
          prediction: predictionPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error calling verifyAndReward:', error);
    }
  };

  // Example: call with some dummy data
  return (
    <button onClick={() => handleVerifyAndReward(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]))}>
      Verify and Reward
    </button>
  );
};

export default VerifyAndRewardComponent;