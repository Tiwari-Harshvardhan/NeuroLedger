# NeuroLedger Setup Guide

This file lists the exact system requirements and step-by-step commands a user must run to use this app on a laptop.

## 1. System Requirements

A user should have the following installed before using this project:

1. **Git**
   - Clone or fork the repository.

2. **Node.js and npm**
   - Recommended: Node 16.x or later.
   - Install from https://nodejs.org/

3. **Rust**
   - Install via https://rustup.rs/
   - The project uses a `rust-toolchain.toml` file.

4. **Solana CLI**
   - Install from https://docs.solana.com/cli/install-solana-cli-tools

5. **Anchor CLI**
   - Install with:
     ```bash
     cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.0 anchor-cli --locked
     ```

6. **Python 3**
   - Install Python 3.10+.
   - Required packages: `numpy`, `scikit-learn`, `skl2onnx`, `onnxruntime`.

7. **Phantom Wallet** (or another Solana wallet extension)
   - Required to connect and sign transactions in the frontend.

## 2. Clone the Repository

```bash
cd ~
git clone https://github.com/<username>/<repo>.git
cd <repo>
```

## 3. Install Node Dependencies

From the project root:

```bash
npm install
```

Then install frontend dependencies inside `app/`:

```bash
cd app
npm install
cd ..
```

## 4. Install Python Dependencies

Install Python packages required for model conversion and prediction:

```bash
python3 -m pip install --user numpy scikit-learn skl2onnx onnxruntime
```

If your system uses `pip` directly, you may also run:

```bash
pip3 install --user numpy scikit-learn skl2onnx onnxruntime
```

## 5. Generate or Verify the ML Model Files

The app expects the following files in the project root:

- `model.pkl`
- `model.onnx`

If `model.pkl` does not exist, generate it with:

```bash
python3 create_sample_model.py
```

Then convert it to ONNX with:

```bash
python3 convert_to_onnx.py
```

## 6. Set Up Solana Local Environment

### 6.1 Start Local Validator

```bash
solana-test-validator --ledger ./test-ledger --mint 1000 --url devnet
```

### 6.2 Configure Solana CLI

```bash
solana config set --url localhost:8899
solana config get
```

### 6.3 Verify Wallet Balance

```bash
solana balance
```

## 7. Build and Deploy Anchor Program

From the project root:

```bash
anchor build
anchor deploy
```

If the program ID changes after deploy, update any environment files or frontend config that use it.

## 8. Run the Frontend Application

From the `app/` directory:

```bash
cd app
npm run dev
```

Open the application in the browser at:

```text
http://localhost:3000
```

If port 3000 is in use, Next.js will propose a different available port.

## 9. Test the Prediction API (Optional)

From the project root, test the API endpoint manually:

```bash
curl -X POST http://localhost:3000/api/predict -H "Content-Type: application/json" -d '{"cgpa": 8.5, "iq": 120}'
```

Expected response structure:

```json
{
  "prediction": 0,
  "confidence": null
}
```

## 10. Checklist Before Use

Make sure the user has:

- [ ] Git clone of the repo
- [ ] `npm install` run in root and `app/`
- [ ] Python dependencies installed
- [ ] `model.pkl` and `model.onnx` present
- [ ] Solana CLI and local validator running
- [ ] Anchor CLI installed and program deployed
- [ ] Browser wallet extension installed
- [ ] Frontend running on `localhost`

## 11. Troubleshooting

- If `npm run dev` fails, ensure `node_modules` is installed in both root and `app/`.
- If ONNX conversion fails, verify `model.pkl` is valid and run `python3 convert_to_onnx.py`.
- If Solana deployment fails, confirm `solana-test-validator` is running and `solana config get` shows `localhost:8899`.
- If the wallet does not connect, use Phantom on devnet or localnet and approve the connection in the extension.
