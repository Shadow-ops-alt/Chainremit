# ChainRemit

**Fast, low-cost global remittances powered by Solana.**

ChainRemit lets anyone send money home in seconds using Solana's on-chain escrow — with near-zero fees, real-time FX rates via Pyth, and a compressed NFT receipt for every transfer. Built for the Colosseum Frontier Hackathon.

## The problem

Global remittances are a $800B/year market. Traditional services (Western Union, MoneyGram) charge 5–7% in fees and take 2–5 days to settle. For families in Nepal, the Philippines, and similar high-remittance corridors, those fees are a significant tax on the money they rely on.

## Our insight

Solana's sub-second finality and ~$0.00025/tx fees make on-chain hash-locked escrow a practical reality — not a research project. A sender locks SOL or USDC into an Anchor escrow PDA; the receiver (or an agent on their behalf) claims it with a one-time token. The relayer mints a Bubblegum compressed NFT as a tamper-proof receipt. No bank account required.

## Market size

Nepal alone receives ~$9B/year in remittances (~26% of GDP). South/Southeast Asia and Sub-Saharan Africa together represent hundreds of billions annually. Capturing even 0.5% of this volume at a 0.5% fee is a $2B+ revenue opportunity.

## Business model

The relayer is the monetization layer — a small FX spread or per-transfer flat fee collected server-side, with the on-chain escrow remaining fully transparent and auditable.

## Features

- Wallet-connected send flow (Phantom, Backpack, etc.)
- Hash-locked Anchor escrow — create / claim / cancel
- Live USD/NPR FX rate (averaged from two sources, cached 60 s)
- Pyth oracle USDC/USD price feed
- Recurring remittance scheduler
- QR-code claim link for cash-out
- Agent console with PIN-gated access and session management
- Metaplex Bubblegum cNFT receipt on every claim
- Solana devnet — program ID: `2AeboQZoaSyBoC2YRcVHvL9CYh5embbddQ6pFubCKdoZ`

## Tech stack

- React 19, Vite, TypeScript
- Node.js, Express 5, Zod
- Solana Web3.js, Anchor 0.32, @coral-xyz/anchor
- Metaplex UMI + mpl-bubblegum (compressed NFTs)
- Pyth Hermes price API
- npm workspaces monorepo

## Project structure

```
Chainremit/
├── apps/
│   ├── web/       # React frontend
│   └── relayer/   # Express API + Solana relayer + NFT minting
├── programs/
│   └── escrow/    # Anchor escrow program (Rust)
├── package.json
└── README.md
```

## Local setup

### Prerequisites
- Node.js 20+
- Rust + Solana CLI + Anchor CLI (for program development)

### 1. Install dependencies
```bash
cd Chainremit
npm install
```

### 2. Configure the relayer
```bash
cp apps/relayer/.env.example apps/relayer/.env
# Edit apps/relayer/.env and fill in your values (see .env.example for instructions)
```

### 3. Run in development
```bash
npm run dev          # starts both relayer (port 8787) and web (port 5173)
npm run dev:web      # web only
npm run dev:relayer  # relayer only
```

### 4. Build for production
```bash
npm run build
```

## Deploying

### Relayer
Deploy `apps/relayer` to Railway, Render, or Fly.io.
Set all env vars from `.env.example` in your hosting dashboard.
Start command: `node dist/server.js`

### Frontend
Deploy `apps/web` to Vercel (auto-detects Vite).
Set `VITE_RELAYER_URL` to your deployed relayer URL.

### Anchor program
Already deployed on devnet. For mainnet:
```bash
anchor deploy --provider.cluster mainnet-beta
```

## Environment variables

See `apps/relayer/.env.example` for the full list with descriptions.

---