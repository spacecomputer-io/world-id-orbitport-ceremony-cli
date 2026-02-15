# World ID Orbitport Ceremony CLI

A single-command CLI tool that orchestrates the [Worldcoin trusted setup ceremony](https://github.com/worldcoin/p0tion) workflow, enhanced with cosmic entropy from the [SpaceComputer Orbitport](https://docs.spacecomputer.io) Cosmic True Random Number Generator (cTRNG).

Instead of manually running multiple `npx` commands and copy-pasting values between steps, this CLI combines authentication, entropy generation, and ceremony contribution into one streamlined flow.

## What it does

1. **Authenticates** via GitHub OAuth using the Worldcoin trusted setup CLI
2. **Generates entropy** by fetching cTRNG from SpaceComputer Orbitport and mixing it with local `crypto.randomBytes` via SHA-256
3. **Contributes** to the ceremony with the generated entropy

## Quick Start

```bash
npx @spacecomputer-io/world-id-orbitport-ceremony-cli
```

That's it. The CLI will walk you through each step.

## Installation

```bash
# Run directly (no install needed)
npx @spacecomputer-io/world-id-orbitport-ceremony-cli

# Or install globally
npm install -g @spacecomputer-io/world-id-orbitport-ceremony-cli
world-id-orbitport-ceremony-cli
```

## Options

```
-V, --version            output the version number
-c, --ceremony <string>  ceremony prefix (default: "world-id-protocol")
-e, --entropy <string>   entropy hex string (skip entropy generation)
--skip-auth              skip authentication (use if already authenticated)
--skip-orbitport         skip Orbitport cTRNG, use local entropy only
-h, --help               display help for command
```

## Examples

```bash
# Full interactive flow
npx @spacecomputer-io/world-id-orbitport-ceremony-cli

# Skip auth if you've already authenticated in a previous run
npx @spacecomputer-io/world-id-orbitport-ceremony-cli --skip-auth

# Provide your own entropy
npx @spacecomputer-io/world-id-orbitport-ceremony-cli --skip-auth --entropy <64-char-hex>

# Use a different ceremony
npx @spacecomputer-io/world-id-orbitport-ceremony-cli --ceremony my-ceremony
```

## Cosmic Entropy

The CLI always fetches cosmic true random data from SpaceComputer Orbitport using the [`@spacecomputer-io/orbitport-sdk-ts`](https://www.npmjs.com/package/@spacecomputer-io/orbitport-sdk-ts) SDK and mixes it with local `crypto.randomBytes(32)` via SHA-256. This ensures the final entropy always has at least local randomness, even if the cTRNG fetch fails.

**There are two cTRNG sources:**

| Source            | Credentials needed | Description                                                                                   |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| **IPFS beacon**   | None               | Reads cTRNG values published to IPFS by the SpaceComputer orbital node. Works out of the box. |
| **Orbitport API** | Yes                | Fetches cTRNG directly from the Orbitport API. Falls back to IPFS if the API is unavailable.  |

By default (no credentials), cTRNG is fetched from the **IPFS beacon** — no account or API keys required.

To use the **Orbitport API** as the primary source, create a `.env` file:

```env
ORBITPORT_CLIENT_ID=your_client_id
ORBITPORT_CLIENT_SECRET=your_client_secret
```

### Entropy mixing

Regardless of the cTRNG source, the final entropy is always:

```
final_entropy = SHA-256(local_random_bytes || ctrng_data)
```

If the cTRNG fetch fails entirely, the CLI falls back to local entropy only. The ceremony is never blocked.

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│           world-id-orbitport-ceremony-cli                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Auth ──► npx world-id-trusted-setup-cli auth         │
│              (GitHub OAuth, token saved locally)         │
│                                                          │
│  2. Entropy                                              │
│     ├── crypto.randomBytes(32)        ← always           │
│     └── Orbitport cTRNG               ← always           │
│         ├── IPFS beacon (default)                        │
│         └── Orbitport API (if credentials set)           │
│         └── SHA-256(local + cosmic) = final entropy      │
│                                                          │
│  3. Contribute ──► npx world-id-trusted-setup-cli        │
│                    contribute -c <id> -e <hex>           │
│                                                          │
│  4. Summary ──► display final entropy used               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
