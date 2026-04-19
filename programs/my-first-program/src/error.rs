use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid proof verification")]
    InvalidProof,
    #[msg("Invalid verification key")]
    InvalidVerificationKey,
    #[msg("Unauthorized: Only authority can perform this action")]
    Unauthorized,
    #[msg("Prediction already rewarded")]
    AlreadyRewarded,
    #[msg("Invalid signer")]
    InvalidSigner,
    #[msg("Insufficient treasury balance")]
    InsufficientTreasuryBalance,
    #[msg("Account ownership check failed")]
    AccountOwnershipCheckFailed,
    #[msg("Invalid account type")]
    InvalidAccountType,
}
