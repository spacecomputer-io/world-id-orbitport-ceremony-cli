import { execaCommand } from "execa";

const WORLDCOIN_CLI =
  "npx @worldcoin/world-id-trusted-setup-cli@1.2.7 auth";

export async function authenticate(): Promise<void> {
  console.log("\n🔐 Starting GitHub OAuth authentication...");
  console.log(
    "This will open your browser for GitHub login.\n"
  );

  await execaCommand(WORLDCOIN_CLI, {
    stdio: "inherit",
    shell: true,
  });

  console.log("✅ Authentication complete. Token saved locally.");
}
