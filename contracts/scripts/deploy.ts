import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const ReceiptEmitter = await ethers.getContractFactory("ReceiptEmitter");
  const receipt = await ReceiptEmitter.deploy(deployer.address);
  await receipt.waitForDeployment();

  const address = await receipt.getAddress();
  const deployTx = receipt.deploymentTransaction();
  console.log(`ReceiptEmitter deployed to: ${address}`);
  console.log(`Owner: ${deployer.address}`);
  console.log(`Deploy tx: ${deployTx?.hash ?? "unknown"}`);
  console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_RECEIPT_EMITTER_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
