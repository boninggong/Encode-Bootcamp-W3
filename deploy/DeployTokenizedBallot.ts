import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

export const PROPOSALS = ["Chocolate", "Vanilla", "Lemon", "Almond"];
export const TARGET_BLOCK_NUMBER = 7990301;
const ERC20_VOTES_ADDRESS = "0xA1D703118fe5b3C2dC00835d6169e448B7e8183C";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let i = 0; i < array.length; i++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[i]));
  }
  return bytes32Array;
}

const deployTokenizedBallot: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, network, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`The deployer address is: ${deployer}`);

  const chainId = network.config.chainId;

  let args = [convertStringArrayToBytes32(PROPOSALS), ERC20_VOTES_ADDRESS, TARGET_BLOCK_NUMBER];
  log("Deploying TokenizedBallot and waiting for confirmations...");
  const tokenizedBallot = await deploy("Ballot", {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: 1,
  });

  log(`TokenizedBallot deployed at ${tokenizedBallot.address}`);
  log("__________________________________________________");

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    // verify the code
    await hre.run("verify:verify", {
      address: tokenizedBallot.address,
      constructorArguments: args,
    });
  }
};

export default deployTokenizedBallot;
deployTokenizedBallot.tags = ["all", "TokenizedBallot"];
