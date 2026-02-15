import crypto from "crypto";

interface OrbitportConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
}

function getOrbitportConfig(): OrbitportConfig | null {
  const clientId = process.env.ORBITPORT_CLIENT_ID;
  const clientSecret = process.env.ORBITPORT_CLIENT_SECRET;
  const authUrl = process.env.ORBITPORT_AUTH_URL;

  if (clientId && clientSecret && authUrl) {
    return { clientId, clientSecret, authUrl };
  }
  return null;
}

async function fetchOrbitportEntropy(
  config: OrbitportConfig
): Promise<string> {
  // Step 1: Get access token from Auth0
  const tokenResponse = await fetch(config.authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      audience: "https://op.spacecomputer.io",
      grant_type: "client_credentials",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(
      `Auth0 token request failed: ${tokenResponse.status} ${tokenResponse.statusText}`
    );
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
  };
  const accessToken = tokenData.access_token;

  // Step 2: Fetch TRNG data from Orbitport
  const trngResponse = await fetch(
    "https://op.spacecomputer.io/api/v1/services/trng",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!trngResponse.ok) {
    throw new Error(
      `Orbitport TRNG request failed: ${trngResponse.status} ${trngResponse.statusText}`
    );
  }

  const trngData = (await trngResponse.json()) as {
    data: string;
  };
  return trngData.data;
}

export async function generateEntropy(
  skipOrbitport: boolean
): Promise<string> {
  console.log("\n🎲 Generating entropy...");

  // Always generate local entropy
  const localBytes = crypto.randomBytes(32);
  console.log("  ✅ Local entropy: 32 bytes from crypto.randomBytes");

  let orbitportHex = "";
  const config = getOrbitportConfig();

  if (skipOrbitport) {
    console.log("  ⏭️  Orbitport: skipped (--skip-orbitport flag)");
  } else if (!config) {
    console.log(
      "  ⏭️  Orbitport: skipped (no credentials in environment)"
    );
  } else {
    try {
      console.log("  🛰️  Fetching cosmic entropy from Orbitport...");
      orbitportHex = await fetchOrbitportEntropy(config);
      console.log(
        `  ✅ Orbitport entropy: ${orbitportHex.length / 2} bytes from SpaceComputer TRNG`
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : String(error);
      console.warn(`  ⚠️  Orbitport fetch failed: ${msg}`);
      console.log("  Continuing with local entropy only.");
    }
  }

  // Mix: SHA-256(localBytes || orbitportHex)
  const hash = crypto.createHash("sha256");
  hash.update(localBytes);
  if (orbitportHex) {
    hash.update(orbitportHex);
  }
  const finalEntropy = hash.digest("hex");

  const sources = orbitportHex
    ? "local + Orbitport (cosmic)"
    : "local only";
  console.log(`\n🔑 Final entropy (${sources}):`);
  console.log(`   ${finalEntropy}\n`);

  return finalEntropy;
}
