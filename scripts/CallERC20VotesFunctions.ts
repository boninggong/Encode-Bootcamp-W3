import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { MyToken, MyToken__factory } from "../typechain";
import * as dotenv from "dotenv";
dotenv.config();

// General script to call function on an ERC20Votes contract on Goerli
async function main() {
  // Setup of network provider and signer
  const provider = ethers.getDefaultProvider("goerli");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "");
  const signer = wallet.connect(provider);

  // Get input arguments
  const args = process.argv;
  const params = args.slice(2);

  // First 2 arguments are always required
  // 1) Address of the Goerli contract to interact with
  // 2) Function name to call
  if (params.length < 2) {
    throw new Error("Missing arguments");
  }

  const contractAddress = params[0];
  const functionCalled = params[1];

  // Build contract function call as string using input args
  let functionCall = `contract.${functionCalled}(`;
  if (params.length > 2) {
    for (let i = 2; i < params.length; i++) {
      if (params[i].substring(0, 2) == "0x") {
        params[i] = JSON.stringify(params[i]); //JSON string for address inputs
      }

      if (i == 2) {
        functionCall = functionCall.concat(`${params[i]}`); // No ',' for 1st parameter
      } else {
        functionCall = functionCall.concat(`,${params[i]}`); // ',' for next parameters
      }
    }
  }
  functionCall = functionCall.concat(")");

  console.log(`Function to call: ${functionCall}`);

  // Connect to a given Goerli contract address
  let contract: MyToken;
  const contractFactory = new MyToken__factory(signer);
  contract = await contractFactory.attach(contractAddress);

  let tx;
  if (functionCalled == "triggerFallback") {
    // Trigger fallback function
    const tx = await signer.sendTransaction({
      to: contract.address,
      data: "0x0000",
    });
    await tx.wait(1);
  } else {
    // Call function with given args input
    tx = await eval(functionCall);
  }

  console.log("Output of function");
  console.log({ tx });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
