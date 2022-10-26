import { ethers } from "hardhat";

async function main() {

  const Contract = await ethers.getContractFactory("SushiToken");
  const contract = await Contract.deploy();

  const deployed = await contract.deployed();

  console.log("Smart contact deployed to : " + deployed.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
