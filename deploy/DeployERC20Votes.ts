import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployERC20Votes: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, network, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`The deployer address is: ${deployer}`);

  let args: any = [];
  log("Deploying ERC20Votes and waiting for confirmations...");
  const ERC20Votes = await deploy("MyToken", {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: 1,
  });

  const chainId = network.config.chainId;

  log(`ERC20Votes deployed at ${ERC20Votes.address}`);
  log("__________________________________________________");

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    // verify the code
    await hre.run("verify:verify", {
      address: ERC20Votes.address,
      constructorArguments: [],
    });
  }
};

export default deployERC20Votes;
module.exports.tags = ["all", "test"];
