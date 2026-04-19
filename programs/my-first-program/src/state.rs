use anchor_lang::prelude::*;

/// Global state for NeuroLedger program
#[account]
#[derive(Default)]
pub struct Config {
    /// Authority that can update the verification key
    pub authority: Pubkey,
    /// Hash of the current verification key (for simple proof validation)
    pub verification_key_hash: [u8; 32],
    /// Total number of verified predictions
    pub total_verified: u64,
    /// SPL Token mint for rewards
    pub reward_mint: Pubkey,
    /// Treasury token account
    pub treasury: Pubkey,
    /// Reward amount per verified prediction (in token units)
    pub reward_amount: u64,
    /// Bump for PDA derivation
    pub bump: u8,
}

/// User prediction account that tracks verified predictions
#[account]
#[derive(Default)]
pub struct UserPrediction {
    /// The user who made the prediction
    pub user: Pubkey,
    /// Hash of the prediction data
    pub prediction_hash: [u8; 32],
    /// Hash of the proof
    pub proof_hash: [u8; 32],
    /// Timestamp of prediction
    pub timestamp: i64,
    /// Whether this prediction has been rewarded
    pub rewarded: bool,
    /// Bump for PDA derivation
    pub bump: u8,
}
