import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const SpendPolicy = await ethers.getContractFactory("SpendPolicy");
  const policy = await SpendPolicy.deploy();
  await policy.waitForDeployment();

  const address = await policy.getAddress();
  const deployTx = policy.deploymentTransaction();
  console.log(`SpendPolicy deployed to: ${address}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deploy tx: ${deployTx?.hash ?? "unknown"}`);
  console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_SPEND_POLICY_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
