const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying Pharbit Contract...");
  console.log("Deployer:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  const Pharbit = await hre.ethers.getContractFactory("Pharbit");

  const pharbit = await Pharbit.deploy({
    gasLimit: 6_000_000, 
    maxFeePerGas: hre.ethers.parseUnits("3", "gwei"),
    maxPriorityFeePerGas: hre.ethers.parseUnits("2", "gwei"),
  });

  console.log("⏳ Transaction sent. Waiting for confirmation...");

  await pharbit.waitForDeployment();

  console.log("Pharbit Contract Deployed at : ", pharbit.target);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});