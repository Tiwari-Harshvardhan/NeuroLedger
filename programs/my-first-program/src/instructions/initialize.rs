use anchor_lang::prelude::*;

use crate::{Config, CONFIG_SEED};

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The authority that initializes the config
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: The reward token mint address is stored but not validated during init
    pub reward_mint: UncheckedAccount<'info>,

    /// CHECK: The treasury token account is stored but not validated during init
    pub treasury: UncheckedAccount<'info>,

    /// Config account to be created
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<Config>(),
        seeds = [CONFIG_SEED.as_bytes()],
        bump
    )]
    pub config: Account<'info, Config>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, initial_reward_amount: u64) -> Result<()> {
    ctx.accounts.config.authority = ctx.accounts.authority.key();
    ctx.accounts.config.reward_mint = ctx.accounts.reward_mint.key();
    ctx.accounts.config.treasury = ctx.accounts.treasury.key();
    ctx.accounts.config.reward_amount = initial_reward_amount;
    ctx.accounts.config.total_verified = 0;
    ctx.accounts.config.verification_key_hash = [0u8; 32];
    ctx.accounts.config.bump = ctx.bumps.config;

    msg!("🚀 NeuroLedger initialized!");
    msg!("💰 Reward amount: {} tokens per verified prediction", initial_reward_amount);
    msg!("🏦 Treasury: {}", ctx.accounts.treasury.key());

    Ok(())
}
