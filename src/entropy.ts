import crypto from "crypto";
import { OrbitportSDK } from "@spacecomputer-io/orbitport-sdk-ts";

export async function generateEntropy(skipOrbitport: boolean): Promise<string> {
  console.log("\n🎲 Generating entropy...");

  // Always generate local entropy
  const localBytes = crypto.randomBytes(32);
  console.log("  ✅ Local entropy: 32 bytes from crypto.randomBytes");

  let cosmicHex = "";

  if (skipOrbitport) {
    console.log("  ⏭️  cTRNG: skipped (--skip-orbitport flag)");
  } else {
    try {
      const clientId = process.env.ORBITPORT_CLIENT_ID;
      const clientSecret = process.env.ORBITPORT_CLIENT_SECRET;
      const hasCredentials = !!(clientId && clientSecret);

      const sdk = new OrbitportSDK({
        config: hasCredentials
          ? {
              clientId,
              clientSecret,
            }
          : {},
      });

      if (hasCredentials) {
        console.log(
          "  🛰️  Fetching cTRNG from Orbitport API (with IPFS fallback)...",
        );
      } else {
        console.log("  🛰️  Fetching cTRNG from IPFS beacon...");
      }

      const result = await sdk.ctrng.random();
      cosmicHex = result.data.data;
      const source = result.data.src;
      console.log(`  ✅ cTRNG entropy received (source: ${source})`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`  ⚠️  cTRNG fetch failed: ${msg}`);
      console.log("  Continuing with local entropy only.");
    }
  }

  // Mix: SHA-256(localBytes || cosmicHex)
  const hash = crypto.createHash("sha256");
  hash.update(localBytes);
  if (cosmicHex) {
    hash.update(cosmicHex);
  }
  const finalEntropy = hash.digest("hex");

  const sources = cosmicHex ? "local + cTRNG (cosmic)" : "local only";
  console.log(`\n🔑 Final entropy (${sources}):`);
  console.log(`   ${finalEntropy}`);

  return finalEntropy;
}
