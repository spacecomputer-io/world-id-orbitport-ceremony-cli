import { execaCommand } from "execa";

const WORLDCOIN_CLI_BASE =
  "npx @worldcoin/world-id-trusted-setup-cli@1.2.7 contribute";

export async function contribute(
  ceremony: string,
  entropy: string
): Promise<void> {
  console.log("\n🏗️  Starting ceremony contribution...");
  console.log(`   Ceremony: ${ceremony}`);
  console.log(`   Entropy:  ${entropy.slice(0, 8)}...${entropy.slice(-8)}\n`);

  const cmd = `${WORLDCOIN_CLI_BASE} -c ${ceremony} -e ${entropy}`;

  try {
    await execaCommand(cmd, {
      stdio: "inherit",
      shell: true,
    });
    console.log("\n🎉 Contribution complete!");
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Contribution failed: ${msg}`);
    process.exit(1);
  }
}
