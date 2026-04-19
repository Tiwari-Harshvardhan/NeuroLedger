pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::ErrorCode;
pub use state::*;
pub use instructions::*;

declare_id!("BtyM5xCXDSAUupX2niKU5jQ46xtcnLDbU99KrpDEZ625");

#[program]
pub mod neuro_ledger {
    use crate::instructions::{Initialize, VerifyAndReward};
    use anchor_lang::prelude::*;

    pub fn initialize(ctx: Context<Initialize>, initial_reward_amount: u64) -> Result<()> {
        crate::instructions::initialize::handler(ctx, initial_reward_amount)
    }

    pub fn verify_and_reward(
        ctx: Context<VerifyAndReward>,
        proof: Vec<u8>,
        public_inputs: Vec<u8>,
    ) -> Result<()> {
        crate::instructions::verify_and_reward::handler(ctx, proof, public_inputs)
    }
}
