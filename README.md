# StacksLotto - On-Chain Lottery System

A decentralized lottery system built on Stacks blockchain with Hiro Chainhooks integration.

## Features

- **Buy Tickets**: Multiple options (Quick Play, Lucky 5, Power Play, Mega Play)
- **Prize Pool**: 95% goes to winner, 5% to contract owner
- **Real-time Updates**: Powered by Hiro Chainhooks
- **Transparent**: All transactions on-chain and verifiable

## Project Structure

```
stackslotto/
├── contracts/
│   └── stacks-lotto.clar      # Main lottery contract
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express server
│   │   ├── services/
│   │   │   └── chainhooks.service.ts
│   │   └── scripts/
│   │       ├── register-chainhooks.ts
│   │       └── check-status.ts
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Main UI
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── public/
│   │   └── icon.svg           # Favicon
│   └── package.json
└── Clarinet.toml
```

## Deployment Steps

### 1. Deploy Smart Contract

```bash
# Using Clarinet for testing
clarinet console

# Deploy to mainnet using Hiro Platform or stacks-cli
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values:
# - HIRO_API_KEY
# - LOTTO_CONTRACT (your deployed contract)
# - WEBHOOK_URL (your Render URL)
# - WEBHOOK_SECRET

# Register chainhooks
npm run chainhook:register

# Start server
npm run dev
```

### 3. Deploy Backend to Render

1. Create new Web Service on Render
2. Connect your GitHub repo
3. Set environment variables:
   - `HIRO_API_KEY`
   - `LOTTO_CONTRACT`
   - `WEBHOOK_URL`
   - `WEBHOOK_SECRET`
   - `STACKS_NETWORK=mainnet`

### 4. Setup Frontend

```bash
cd frontend
npm install

# Update contract address in page.tsx if needed
NEXT_PUBLIC_LOTTO_CONTRACT=SP...your-contract

npm run dev
```

### 5. Deploy Frontend to Vercel

```bash
cd frontend
npx vercel
```

## Contract Functions

| Function | Description | Cost |
|----------|-------------|------|
| `quick-play` | Buy 1 ticket | 0.1 STX |
| `lucky-five` | Buy 5 tickets | 0.5 STX |
| `power-play` | Buy 10 tickets | 1.0 STX |
| `mega-play` | Buy 25 tickets | 2.5 STX |
| `draw-winner` | Draw winner (requires min 2 players) | Gas only |

## Chainhooks

5 chainhooks tracking:
1. Single ticket purchases
2. Bulk ticket purchases  
3. Winner draws
4. Lottery paused events
5. Lottery resumed events

## License

MIT

## Built For

Stacks Builder Challenge Week 2 - Demonstrating Hiro Chainhooks Integration
