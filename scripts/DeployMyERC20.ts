import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { MyERC20Token__factory } from "../typechain";
dotenv.config();

async function main() {
  const accounts = await ethers.getSigners();
  const erc20TokensFactory = new MyERC20Token__factory(accounts[0]);
  const erc20TokenContract = await erc20TokensFactory.deploy();
  await erc20TokenContract.deployed();

  const totalSupply = await erc20TokenContract.totalSupply();
  console.log(totalSupply);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
