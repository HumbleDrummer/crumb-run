# CRUMB.RUN

CRUMB.RUN is an on-chain pulse board built for Cookie Chain. Connect a Solana-compatible wallet (Nightly recommended), choose a signal, and publish it as a permanent Memo Program transaction. The interface tracks confirmation in real time and reconstructs the connected wallet's signal trail from chain history.

## Features

- Nightly support through the Solana Wallet Standard
- Cookie Chain RPC connection
- Four on-chain signals: `BUILD`, `SHIP`, `HODL`, `CHAOS`
- Live transaction lifecycle and actionable errors
- CookieScan transaction links
- Wallet balance and on-chain signal history
- Responsive terminal-inspired interface

## On-chain format

Every signal invokes the canonical SPL Memo Program with:

```text
CRUMB.RUN:v1:<SIGNAL>:<UNIX_TIMESTAMP_MS>
```

Program address: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`

Only the normal Cookie Chain fee is paid. CRUMB.RUN does not transfer or custody funds.

## Local setup

Requires Node.js 20+ and Nightly configured for Cookie Chain.

```bash
npm install
copy .env.example .env
npm run dev
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_COOKIE_RPC_URL` | `https://rpc.cookiescan.io` | Cookie Chain JSON-RPC endpoint |

Nightly custom network: RPC `https://rpc.cookiescan.io`, WebSocket `https://wss.cookiescan.io`, native token `COOK`.

## Verification

1. Confirm the connected wallet address is visible.
2. Publish a signal and approve it in Nightly.
3. Wait for `Pulse confirmed`.
4. Open `VIEW TX` and verify the memo in CookieScan.
5. Refresh `YOUR TRAIL` and confirm the signal appears.

## Security

- No private keys or seed phrases are requested or stored.
- Transactions require explicit wallet signatures.
- Each action submits one Memo Program instruction.
- Use a low-value development wallet and verify instructions before signing.

## Status

Source implementation does not by itself prove a production deployment or real Cookie Chain transaction. Those require separate verification.

## License

MIT
