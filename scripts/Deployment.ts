import { ethers } from "hardhat";
import { MyToken__factory } from "../typechain";

const TEST_MINT_VALUE = ethers.utils.parseEther("10");

async function main() {
  // ethers wallet PK to deploy to Goerli
  const accounts = await ethers.getSigners();
  const [minter, voter, other] = accounts;

  const contractFactory = new MyToken__factory(minter);
  const contract = await contractFactory.deploy();
  await contract.deployed();
  console.log(`Tokenized Votes contract deployed at ${contract.address}\n`);

  let voterTokenBalance = await contract.balanceOf(voter.address);
  console.log(`The voters starts with  ${voterTokenBalance} decimals of balance \n`);

  const mintTx = await contract.mint(voter.address, TEST_MINT_VALUE);
  await mintTx.wait();

  voterTokenBalance = await contract.balanceOf(voter.address);
  console.log(`The voters balance after mint is ${voterTokenBalance} decimals of balance \n`);

  let votePower = await contract.getVotes(voter.address);
  console.log(`The voters vote power after mint is ${votePower} decimals of balance \n`);

  const delegateTx = await contract.connect(voter).delegate(voter.address);
  await delegateTx.wait();

  votePower = await contract.getVotes(voter.address);
  console.log(`The voters vote power after delegating voting is ${votePower} decimals of balance \n`);

  const transferTx = await contract.connect(voter).transfer(other.address, TEST_MINT_VALUE.div(2));
  await transferTx.wait();

  const delegateOtherTx = await contract.connect(other).delegate(other.address);
  await delegateOtherTx.wait();

  votePower = await contract.getVotes(voter.address);
  console.log(`The voters vote power after transfer voting is ${votePower} decimals of balance \n`);
  let votePowerOther = await contract.getVotes(other.address);
  console.log(`The others vote power after transfer voting is ${votePowerOther} decimals of balance \n`);

  const currentBlock = await ethers.provider.getBlock("latest");
  for (let blockNumber = currentBlock.number - 1; blockNumber >= 0; blockNumber--) {
    const pastVotePower = await contract.getPastVotes(voter.address, blockNumber);
    console.log(`At block ${blockNumber} the voter had ${pastVotePower} decimals of balance \n`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
