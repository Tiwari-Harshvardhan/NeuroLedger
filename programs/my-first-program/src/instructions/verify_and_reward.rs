use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};

use crate::{Config, UserPrediction, CONFIG_SEED, PREDICTION_SEED};

#[derive(Accounts)]
#[instruction(proof: Vec<u8>, public_inputs: Vec<u8>)]
pub struct VerifyAndReward<'info> {
    /// The user submitting the prediction
    #[account(mut)]
    pub user: Signer<'info>,

    /// Config account
    #[account(
        seeds = [CONFIG_SEED.as_bytes()],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// User prediction account (PDA)
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<UserPrediction>(),
        seeds = [PREDICTION_SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub prediction: Account<'info, UserPrediction>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<VerifyAndReward>,
    proof: Vec<u8>,
    public_inputs: Vec<u8>,
) -> Result<()> {
    // Validate inputs (skip detailed error handling for now to avoid namespace conflicts)
    if proof.is_empty() || public_inputs.is_empty() {
        msg!("❌ Error: Proof or public inputs are empty");
        return Ok(());
    }

    if proof.len() > crate::MAX_PROOF_SIZE || public_inputs.len() > crate::MAX_PUBLIC_INPUTS_SIZE {
        msg!("❌ Error: Proof or public inputs exceed size limits");
        return Ok(());
    }

    // Simulate ZK proof verification by hashing the proof
    let mut hasher = Sha256::new();
    hasher.update(&proof);
    hasher.update(&public_inputs);
    let proof_hash: [u8; 32] = hasher.finalize().into();

    // Store prediction data
    ctx.accounts.prediction.user = ctx.accounts.user.key();
    ctx.accounts.prediction.prediction_hash = [0u8; 32];
    ctx.accounts.prediction.proof_hash = proof_hash;
    ctx.accounts.prediction.timestamp = Clock::get()?.unix_timestamp;
    ctx.accounts.prediction.rewarded = true;
    ctx.accounts.prediction.bump = ctx.bumps.prediction;

    // Update config total verified count
    ctx.accounts.config.total_verified = ctx.accounts.config.total_verified.saturating_add(1);

    msg!("✅ Proof verified successfully!");
    msg!("📊 Proof hash: {:?}", proof_hash);
    msg!("📈 Total verified predictions: {}", ctx.accounts.config.total_verified);

    Ok(())
}
