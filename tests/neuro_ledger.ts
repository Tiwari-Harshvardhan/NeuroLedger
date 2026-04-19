import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { NeuroLedger } from "../target/types/neuro_ledger";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";

describe("NeuroLedger", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NeuroLedger as Program<NeuroLedger>;

  let mint: PublicKey;
  let treasuryAccount: PublicKey;
  let userTokenAccount: PublicKey;
  let configPDA: PublicKey;
  let configBump: number;

  const payer = provider.wallet as anchor.Wallet;
  const user = Keypair.generate();
  const authority = payer.payer;

  const CONFIG_SEED = "neuro_ledger_config";
  const REWARD_AMOUNT = new anchor.BN(100);

  before(async () => {
    // Airdrop SOL to user for transaction fees
    const airdropSig = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Create a mint
    mint = await createMint(
      provider.connection,
      payer.payer,
      authority.publicKey,
      null,
      6
    );

    // Create treasury account
    treasuryAccount = await createAccount(
      provider.connection,
      payer.payer,
      mint,
      authority.publicKey
    );

    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      mint,
      user.publicKey
    );

    // Mint tokens to treasury
    await mintTo(
      provider.connection,
      payer.payer,
      mint,
      treasuryAccount,
      authority,
      1000 * Math.pow(10, 6) // 1000 tokens
    );

    // Derive config PDA
    [configPDA, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from(CONFIG_SEED)],
      program.programId
    );
  });

  it("Initializes the NeuroLedger config", async () => {
    try {
      const tx = await program.methods
        .initialize(REWARD_AMOUNT)
        .accounts({
          authority: authority.publicKey,
          rewardMint: mint,
          treasury: treasuryAccount,
          config: configPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("✅ Initialize transaction:", tx);

      // Verify config was created
      const configAccount = await program.account.config.fetch(configPDA);
      expect(configAccount.authority.toBase58()).to.equal(
        authority.publicKey.toBase58()
      );
      expect(configAccount.rewardMint.toBase58()).to.equal(mint.toBase58());
      expect(configAccount.rewardAmount.toNumber()).to.equal(
        REWARD_AMOUNT.toNumber()
      );
      expect(configAccount.totalVerified.toNumber()).to.equal(0);

      console.log("✅ Config verified successfully");
    } catch (error) {
      console.error("❌ Initialize failed:", error);
      throw error;
    }
  });

  it("Verifies a ZK proof and rewards the user", async () => {
    try {
      // Create mock proof and public inputs
      const mockProof = Buffer.from(
        Array(256)
          .fill(0)
          .map(() => Math.floor(Math.random() * 256))
      );
      const mockPublicInputs = Buffer.from([1, 2, 3, 4, 5]);

      // Derive prediction PDA
      const [predictionPDA, predictionBump] =
        PublicKey.findProgramAddressSync(
          [
            Buffer.from("user_prediction"),
            user.publicKey.toBuffer(),
            mockProof.slice(0, 32),
          ],
          program.programId
        );

      const initialBalance = await provider.connection.getTokenAccountBalance(
        userTokenAccount
      );
      console.log(
        "Initial user token balance:",
        initialBalance.value.amount,
        "units"
      );

      const tx = await program.methods
        .verifyAndReward(Array.from(mockProof), Array.from(mockPublicInputs))
        .accounts({
          user: user.publicKey,
          config: configPDA,
          prediction: predictionPDA,
          userTokenAccount: userTokenAccount,
          treasury: treasuryAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("✅ Verify and Reward transaction:", tx);

      // Check user received tokens
      const finalBalance = await provider.connection.getTokenAccountBalance(
        userTokenAccount
      );
      console.log(
        "Final user token balance:",
        finalBalance.value.amount,
        "units"
      );

      const balanceDiff =
        parseInt(finalBalance.value.amount) -
        parseInt(initialBalance.value.amount);
      expect(balanceDiff).to.equal(REWARD_AMOUNT.toNumber());

      // Verify prediction was created and marked as rewarded
      const predictionAccount = await program.account.userPrediction.fetch(
        predictionPDA
      );
      expect(predictionAccount.user.toBase58()).to.equal(user.publicKey.toBase58());
      expect(predictionAccount.rewarded).to.be.true;

      // Verify config was updated
      const updatedConfig = await program.account.config.fetch(configPDA);
      expect(updatedConfig.totalVerified.toNumber()).to.equal(1);

      console.log("✅ Proof verification and reward successful");
    } catch (error) {
      console.error("❌ Verify and Reward failed:", error);
      throw error;
    }
  });

  it("Prevents double rewarding the same prediction", async () => {
    try {
      const mockProof = Buffer.from(
        Array(256)
          .fill(0)
          .map(() => Math.floor(Math.random() * 256))
      );
      const mockPublicInputs = Buffer.from([6, 7, 8, 9, 10]);

      const [predictionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_prediction"),
          user.publicKey.toBuffer(),
          mockProof.slice(0, 32),
        ],
        program.programId
      );

      // First submission should succeed
      await program.methods
        .verifyAndReward(Array.from(mockProof), Array.from(mockPublicInputs))
        .accounts({
          user: user.publicKey,
          config: configPDA,
          prediction: predictionPDA,
          userTokenAccount: userTokenAccount,
          treasury: treasuryAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("✅ First submission successful");

      // Second submission with same proof should fail (PDA already exists)
      try {
        await program.methods
          .verifyAndReward(Array.from(mockProof), Array.from(mockPublicInputs))
          .accounts({
            user: user.publicKey,
            config: configPDA,
            prediction: predictionPDA,
            userTokenAccount: userTokenAccount,
            treasury: treasuryAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();

        throw new Error("Should have failed on double submission");
      } catch (error: any) {
        if (error.message.includes("Should have failed")) {
          throw error;
        }
        console.log("✅ Double submission correctly prevented");
      }
    } catch (error) {
      console.error("❌ Double submission test failed:", error);
      throw error;
    }
  });
});
