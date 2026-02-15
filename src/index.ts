#!/usr/bin/env node

import "dotenv/config";
import { Command } from "commander";
import { authenticate } from "./auth.js";
import { generateEntropy } from "./entropy.js";
import { contribute } from "./contribute.js";

const BANNER = `
╔══════════════════════════════════════════════════════════╗
║       World ID Orbitport Ceremony CLI                    ║
║       Trusted Setup with Cosmic Entropy                  ║
╚══════════════════════════════════════════════════════════╝
`;

const program = new Command();

program
  .name("world-id-orbitport-ceremony-cli")
  .description(
    "Orchestrate the Worldcoin trusted setup ceremony with Orbitport cosmic entropy",
  )
  .version("1.0.0")
  .option("-c, --ceremony <string>", "ceremony prefix", "world-id-protocol")
  .option(
    "-e, --entropy <string>",
    "entropy hex string (skip entropy generation)",
  )
  .option(
    "--skip-auth",
    "skip authentication (use if already authenticated)",
    false,
  )
  .option(
    "--skip-orbitport",
    "skip Orbitport entropy even if credentials are available",
    false,
  )
  .action(async (options) => {
    console.log(BANNER);

    // Step 1: Authentication
    if (!options.skipAuth) {
      await authenticate();
    } else {
      console.log("🔐 Skipping auth (using locally stored token).");
    }

    // Step 2: Entropy
    let entropy: string = options.entropy;
    if (!entropy) {
      entropy = await generateEntropy(options.skipOrbitport);
    } else {
      console.log(`🎲 Using provided entropy: ${entropy.slice(0, 8)}...`);
    }

    // Step 3: Contribute
    await contribute(options.ceremony, entropy);
  });

program.parse();
