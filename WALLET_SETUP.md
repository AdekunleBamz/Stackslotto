# Wallet Setup Guide

## Where to Add Your Wallet Phrase/Private Key

### For Frontend Transactions (User Wallet)
The frontend uses **Stacks Connect** which connects to your browser wallet (Hiro Wallet, Xverse, etc.). 
**You don't need to add your phrase here** - users connect their own wallets through the browser extension.

### For Backend/Automated Transactions
If you need to sign transactions programmatically (e.g., for automated draws, admin functions), add your credentials to:

**File: `backend/.env`**

```bash
# Option 1: Private Key (Recommended)
STACKS_PRIVATE_KEY=your_private_key_here

# Option 2: Mnemonic Phrase (12 or 24 words)
STACKS_MNEMONIC=word1 word2 word3 ... word12
```

### For Contract Deployment
The `deploy.mjs` script uses:
```bash
STACKS_PRIVATE_KEY=your_private_key_here
```

## How to Get Your Private Key

### From Hiro Wallet:
1. Open Hiro Wallet extension
2. Go to Settings → Show Secret Key
3. Copy your private key (starts with a number)

### From Mnemonic Phrase:
If you have a 12 or 24-word mnemonic phrase, you can derive the private key using:
```javascript
import { generateWallet } from '@stacks/wallet-sdk';
const wallet = await generateWallet({ secretKey: mnemonic });
const privateKey = wallet.privateKey;
```

## Security Notes
- ✅ `.env` files are already in `.gitignore` - your secrets won't be committed
- ✅ Never commit private keys or mnemonics to git
- ✅ Use environment variables, never hardcode secrets
- ✅ For production, use secure secret management services

## Current Environment Variables Needed

Create `backend/.env` with:
```bash
HIRO_API_KEY=your_hiro_api_key
STACKS_NETWORK=mainnet
LOTTO_CONTRACT=SP...your-contract.stacks-lotto
WEBHOOK_URL=https://your-backend-url.com/api/chainhook/events
WEBHOOK_SECRET=your_webhook_secret
PORT=3001
STACKS_PRIVATE_KEY=your_private_key_here  # Add this for automated transactions
```

