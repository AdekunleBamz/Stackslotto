# Deploy Contract Using Hiro Tools - Complete Guide

There are several ways to deploy your Clarity contract directly using Hiro tools. Here are the most common methods:

## Method 1: Using Clarinet (Recommended for Developers)

Clarinet is Hiro's official development tool for Clarity contracts.

### Prerequisites
```bash
# Install Clarinet
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-installer.sh | bash

# Or using Homebrew (macOS)
brew install clarinet

# Verify installation
clarinet --version
```

### Steps

1. **Navigate to your project**
```bash
cd /home/bakhraayn/Downloads/stackslotto
```

2. **Update Clarinet.toml for Clarity 4**
```toml
[contracts.stacks-lotto]
path = "contracts/stacks-lotto.clar"
clarity_version = 4  # Update to 4
epoch = 2.5
```

3. **Check contract syntax**
```bash
clarinet check
```

4. **Deploy to mainnet**
```bash
# Deploy using Clarinet
clarinet deployments apply --mainnet

# Or use the interactive deployment
clarinet deployments apply
# Select "mainnet" when prompted
```

**Note:** Clarinet deployments require you to have your private key configured. You'll be prompted to enter it securely.

---

## Method 2: Using Hiro Wallet (Browser Extension) - Easiest Method

This is the simplest way if you have Hiro Wallet installed.

### Steps

1. **Open Hiro Wallet Extension**
   - Make sure you're connected to **Mainnet**
   - Ensure you have enough STX for deployment fees (at least 1-2 STX)

2. **Go to Stacks Explorer**
   - Visit: https://explorer.hiro.so/sandbox/deploy
   - Or use: https://www.stacks.co/developers

3. **Deploy Contract**
   - Click "Deploy Contract" or "Sandbox"
   - Paste your contract code from `contracts/stacks-lotto.clar`
   - Enter contract name: `stacks-lotto`
   - Click "Deploy"
   - Hiro Wallet will prompt you to sign the transaction
   - Approve the transaction

4. **Wait for Confirmation**
   - Transaction confirms in ~1 minute (Nakamoto upgrade)
   - Your contract will be at: `YOUR_ADDRESS.stacks-lotto`

---

## Method 3: Using Stacks CLI

### Installation
```bash
# Install Stacks CLI
npm install -g @stacks/cli

# Or using yarn
yarn global add @stacks/cli
```

### Deploy Command
```bash
# Set your private key (or use --mnemonic)
export STACKS_PRIVATE_KEY=your_private_key_here

# Deploy to mainnet
stacks deploy \
  --contract-name stacks-lotto \
  --contract-path ./contracts/stacks-lotto.clar \
  --network mainnet \
  --fee 500000
```

---

## Method 4: Using Hiro Platform (Web Interface)

1. **Go to Hiro Platform**
   - Visit: https://platform.hiro.so/
   - Sign in with your Hiro account

2. **Navigate to Contracts**
   - Click on "Contracts" in the sidebar
   - Click "Deploy New Contract"

3. **Upload Contract**
   - Enter contract name: `stacks-lotto`
   - Copy and paste your contract code from `contracts/stacks-lotto.clar`
   - Select network: **Mainnet**
   - Review and confirm

4. **Sign Transaction**
   - Hiro Wallet will prompt you to sign
   - Approve the transaction

---

## Method 5: Using Stacks.js (Programmatic - Current Method)

This is what your `deploy.mjs` script uses. It's already set up!

```bash
# Make sure you have your mnemonic in backend/.env
cd /home/bakhraayn/Downloads/stackslotto
npx tsx deploy.mjs
```

---

## Recommended: Hiro Wallet Method (Easiest)

**For quick deployment, I recommend Method 2 (Hiro Wallet):**

1. **Copy your contract code:**
```bash
cat contracts/stacks-lotto.clar | pbcopy  # macOS
# Or just open the file and copy
```

2. **Go to Stacks Explorer Sandbox:**
   - Visit: https://explorer.hiro.so/sandbox/deploy
   - Or: https://www.stacks.co/developers

3. **Deploy:**
   - Paste contract code
   - Name: `stacks-lotto`
   - Network: **Mainnet**
   - Click Deploy
   - Sign with Hiro Wallet

4. **Get your contract address:**
   - After deployment, your contract will be at: `YOUR_WALLET_ADDRESS.stacks-lotto`
   - Update your `.env` files with this address

---

## After Deployment

1. **Update Environment Variables:**
```bash
# backend/.env
LOTTO_CONTRACT=YOUR_ADDRESS.stacks-lotto

# frontend/.env.local (if using)
NEXT_PUBLIC_LOTTO_CONTRACT=YOUR_ADDRESS.stacks-lotto
```

2. **Register Chainhooks:**
```bash
cd backend
npm run chainhook:register
```

3. **Verify Contract:**
```bash
curl https://api.hiro.so/v2/contracts/YOUR_ADDRESS/stacks-lotto
```

---

## Troubleshooting

### "Insufficient STX"
- Make sure you have at least 1-2 STX in your wallet
- Deployment fees are typically 0.5-1 STX

### "Contract already exists"
- You can't redeploy to the same address with the same name
- Either use a different wallet address or change the contract name

### "Syntax errors"
- Run `clarinet check` to validate your contract before deploying
- Make sure all Clarity 4 syntax is correct

---

## Quick Reference

| Method | Difficulty | Speed | Best For |
|--------|-----------|-------|----------|
| Hiro Wallet | ⭐ Easy | Fast | Quick deployments |
| Clarinet | ⭐⭐ Medium | Fast | Developers |
| Stacks CLI | ⭐⭐ Medium | Fast | Automation |
| Hiro Platform | ⭐ Easy | Medium | Web interface |
| Stacks.js (deploy.mjs) | ⭐⭐⭐ Advanced | Fast | Scripted deployments |

**Recommendation:** Use **Hiro Wallet + Stacks Explorer Sandbox** for the easiest deployment experience!

