# NeuroLedger: ML Predictions with ZK Proofs on Solana

NeuroLedger is a full-stack decentralized application (dApp) that combines off-chain machine learning models with zero-knowledge proofs and on-chain verification on Solana. Users can submit ML predictions, prove them using ZK technology, and earn SPL token rewards for verified predictions.

## Architecture Overview

### Components

1. **Anchor Smart Contract** (`/programs/neuro-ledger/`)
   - `initialize`: Sets up the NeuroLedger configuration with reward parameters
   - `verify_and_reward`: Verifies ZK proofs and transfers reward tokens to users
   - State accounts: `Config`, `UserPrediction`

2. **React Frontend** (`/app/`)
   - Wallet connection using Phantom/Solflare
   - Prediction submission form
   - ZK proof generation interface
   - Transaction status tracking

3. **Testing Suite**
   - Anchor TypeScript tests with mock ZK proofs
   - Token account setup and verification

## Prerequisites

Ensure you have the following installed:

- **Rust** (latest stable) - [https://rustup.rs/](https://rustup.rs/)
- **Solana CLI** - [https://docs.solana.com/cli/install-solana-cli-tools](https://docs.solana.com/cli/install-solana-cli-tools)
- **Anchor Framework** - `cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.0 anchor-cli --locked`
- **Node.js** (v16+) and npm/yarn
- **Phantom Wallet** browser extension for testing

## Project Structure

```
.
├── programs/
│   └── my-first-program/
│       └── src/
│           ├── lib.rs                 # Main program entry
│           ├── state.rs              # Account structures (Config, UserPrediction)
│           ├── error.rs              # Custom error codes
│           ├── constants.rs          # Program constants and seeds
│           └── instructions/
│               ├── initialize.rs     # Initialize instruction
│               └── verify_and_reward.rs  # ZK proof verification
├── app/
│   ├── pages/
│   │   ├── _app.tsx                 # Wallet provider setup
│   │   └── index.tsx                # Main dashboard
│   ├── components/
│   │   ├── WalletConnection.tsx     # Wallet connection UI
│   │   ├── PredictionForm.tsx       # Prediction submission form
│   │   ├── PredictionDashboard.tsx  # Main dashboard
│   │   └── TransactionStatus.tsx    # Transaction feedback
│   ├── lib/
│   │   └── solana.ts                # Solana utilities
│   └── styles/
│       └── globals.css              # Global styles
├── tests/
│   └── neuro_ledger.ts             # Anchor program tests
└── README.md (this file)
```

## Setup & Installation

### 1. Clone and Install Dependencies

```bash
cd /home/harshvardhan_tiwari/my-first-program

# Install root dependencies
npm install

# Install app dependencies
cd app
npm install
cd ..
```

### 2. Configure Environment

Copy the template and fill in your values:

```bash
cp app/.env.local.template app/.env.local
```

Edit `app/.env.local`:
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=AUB5zFoihMKGSJJudCBFPUKGVMgBW6QAcwMZbTPWkQxW
NEXT_PUBLIC_RPC_ENDPOINT=http://localhost:8899
```

Edit `.env` in the root:
```
SOLANA_RPC_ENDPOINT=http://localhost:8899
SOLANA_WALLET_PATH=~/.config/solana/id.json
PROGRAM_ID=AUB5zFoihMKGSJJudCBFPUKGVMgBW6QAcwMZbTPWkQxW
```

## Running the Project Locally

### Step 1: Start the Local Solana Validator

```bash
solana-test-validator \
  --ledger ./test-ledger \
  --mint 1000 \
  --url devnet
```

This starts a local test validator on `http://localhost:8899` with 1000 SOL in your wallet.

### Step 2: Configure Solana CLI for Localnet

```bash
solana config set --url localhost:8899
```

Verify the setup:
```bash
solana cluster-version
solana balance
```

### Step 3: Build the Anchor Program

```bash
anchor build
```

This compiles the Rust program and generates IDL (Interface Definition Language) files.

### Step 4: Deploy to Local Validator

```bash
anchor deploy
```

The program will be deployed, and you'll see the program ID. Update your `.env` and `app/.env.local` with this ID if different.

### Step 5: Run the Tests

```bash
anchor test
```

This runs the TypeScript tests that verify:
- ✅ Config initialization with correct parameters
- ✅ ZK proof verification and reward transfer
- ✅ Prevention of double-rewarding the same prediction

Expected output:
```
NeuroLedger
    ✅ Initializes the NeuroLedger config
    ✅ Verifies a ZK proof and rewards the user
    ✅ Prevents double rewarding the same prediction

  3 passing
```

### Step 6: Start the Frontend Development Server

In a new terminal:

```bash
cd app
npm run dev
```

The application will be available at `http://localhost:3000`

## Operational Commands Summary

### Quick Start (All-in-One)

```bash
# Terminal 1: Start local validator
solana-test-validator --ledger ./test-ledger --mint 1000 --url devnet

# Terminal 2: Build and deploy
anchor build && anchor deploy

# Terminal 3: Run tests
anchor test

# Terminal 4: Start frontend
cd app && npm run dev
```

### Individual Commands

| Command | Purpose |
|---------|---------|
| `anchor build` | Compile the Rust program |
| `anchor deploy` | Deploy to configured cluster |
| `anchor test` | Run TypeScript tests |
| `solana-test-validator` | Start local blockchain |
| `solana config set --url localhost:8899` | Configure CLI for localnet |
| `solana balance` | Check SOL balance |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build Next.js for production |

## Workflow: Submitting a Prediction

1. **Connect Wallet**: Click "Select Wallet" and connect your Phantom wallet (or create a local keypair)

2. **Generate or Obtain ZK Proof**:
   - In production, use `arkworks` or `bellman` to generate a real ZK proof
   - For testing, provide mock proof data in hex or base64 format

3. **Submit Form**:
   - Paste prediction data (hex/base64)
   - Paste ZK proof (hex/base64)
   - Click "Submit Prediction"

4. **Transaction Confirmation**:
   - Sign the transaction in your wallet
   - Wait for confirmation (~15 seconds on localnet)
   - View transaction details on the explorer

5. **Receive Reward**:
   - Tokens are transferred to your token account
   - Check "Total Rewards Earned" in the dashboard

## Environment Configuration

### `.env` File (Root - Backend/Testing)

```env
# Network endpoint
SOLANA_RPC_ENDPOINT=http://localhost:8899

# Wallet configuration
SOLANA_WALLET_PATH=~/.config/solana/id.json

# Program and account addresses
PROGRAM_ID=AUB5zFoihMKGSJJudCBFPUKGVMgBW6QAcwMZbTPWkQxW
TOKEN_MINT_ADDRESS=YourTokenMintHere
TREASURY_ACCOUNT_ADDRESS=YourTreasuryAccountHere

# Cluster selection
CLUSTER=localnet
```

### `.env.local` File (Frontend)

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=AUB5zFoihMKGSJJudCBFPUKGVMgBW6QAcwMZbTPWkQxW
NEXT_PUBLIC_RPC_ENDPOINT=http://localhost:8899
```

## Program Instructions

### `initialize`

Initializes the NeuroLedger configuration. Must be called once before any predictions can be submitted.

**Accounts:**
- `authority`: The wallet initializing the config
- `reward_mint`: SPL token mint for rewards
- `treasury`: Token account containing reward tokens
- `config`: PDA for storing config (derived from seed)

**Parameters:**
- `initial_reward_amount`: Amount of tokens to reward per verified prediction

**Example:**
```typescript
const tx = await program.methods
  .initialize(new BN(100))
  .accounts({...})
  .rpc();
```

### `verify_and_reward`

Verifies a ZK proof and transfers reward tokens to the user.

**Accounts:**
- `user`: The prediction submitter
- `config`: Program config account
- `prediction`: PDA for storing prediction metadata
- `user_token_account`: User's token account to receive rewards
- `treasury`: Treasury token account (source of rewards)

**Parameters:**
- `proof`: Vec<u8> - The serialized ZK proof
- `public_inputs`: Vec<u8> - Public inputs for the proof

**Example:**
```typescript
const tx = await program.methods
  .verifyAndReward(proofBytes, publicInputsBytes)
  .accounts({...})
  .rpc();
```

## ZK Proof Integration (Next Steps)

Currently, the program validates proof structure but doesn't perform actual ZK verification. To integrate real ZK proofs:

1. **Add arkworks dependency** to `Cargo.toml`:
```toml
arkworks-rs = { git = "https://github.com/arkworks-rs/snark", branch = "master" }
```

2. **Parse proof data** in `verify_and_reward.rs`:
```rust
let proof = <Proof as CanonicalDeserialize>::deserialize(&mut proof.as_slice())?;
let vk = <VerificationKey as CanonicalDeserialize>::deserialize(&mut vk_bytes)?;
```

3. **Verify the proof**:
```rust
let valid = verify(&vk, &public_inputs, &proof)?;
require!(valid, ErrorCode::InvalidProof);
```

## Security Considerations

✅ **Implemented:**
- Account ownership checks
- Authority-gated initialization
- PDA-based account derivation to prevent unauthorized access
- Replay attack protection via unique proof hashes
- Double-rewarding prevention (each proof can only be submitted once)

⚠️ **For Production:**
- Implement actual ZK proof verification using arkworks/bellman
- Add rate limiting to prevent spam
- Use multisig for authority management
- Consider audit before mainnet deployment
- Implement timelocks for critical operations
- Add comprehensive event logging

## Troubleshooting

### "Program ID mismatch"
- Ensure you updated `PROGRAM_ID` in both `.env` and `app/.env.local` after deployment

### "Insufficient treasury balance"
- The treasury token account needs enough tokens to reward users. Mint more or check balance:
```bash
spl-token accounts <MINT_ADDRESS>
```

### "Transaction failed: Invalid account owner"
- Ensure all token accounts are created with the correct mint
- Use `spl-token accounts` to verify account owners

### "Wallet not connecting"
- Ensure Phantom wallet is installed and unlocked
- Try a different wallet adapter (Solflare)
- Check browser console for errors

### "Tests failing with 'Program not found'"
- Make sure to run `anchor build` before `anchor test`
- Check that the local validator is running

## Testing ZK Proofs Locally

Generate mock proofs for testing:

```typescript
// Generate random proof bytes
const mockProof = Buffer.from(
  Array(256).fill(0).map(() => Math.floor(Math.random() * 256))
);

// Or use hex/base64
const proofHex = "aabbccdd...";
const proof = Buffer.from(proofHex, 'hex');
```

## Deployment to Devnet

1. **Update `.env` and program config:**
```env
SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
CLUSTER=devnet
```

2. **Deploy:**
```bash
anchor deploy --provider.cluster devnet
```

3. **Create token mint and treasury on Devnet:**
```bash
solana config set --url https://api.devnet.solana.com
spl-token create-mint 6
spl-token create-account <MINT_ADDRESS>
spl-token mint <MINT_ADDRESS> 10000 <ACCOUNT_ADDRESS>
```

4. **Update frontend config:**
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<YOUR_DEPLOYED_PROGRAM_ID>
```

## File Format

When submitting predictions, format your data properly:

**Hex Format:** `0xaabbccdd...` or `aabbccdd...`
**Base64 Format:** `aGVsbG8gd29ybGQ=`

The program will automatically detect and parse your format.

## API Reference

See the Anchor IDL at `target/idl/neuro_ledger.json` for complete API documentation.

## Contributing

Contributions are welcome! Please ensure:
- All tests pass: `anchor test`
- Code follows Rust conventions: `cargo fmt`
- Linting passes: `cargo clippy`

## License

ISC

## Support & Resources

- **Solana Docs**: https://docs.solana.com
- **Anchor Book**: https://www.anchor-lang.com
- **arkworks**: https://github.com/arkworks-rs
- **SPL Token**: https://spl.solana.com

---

**Questions?** Check the test file (`tests/neuro_ledger.ts`) for detailed examples of how to interact with the program.
