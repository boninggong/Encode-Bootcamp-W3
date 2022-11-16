import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { MyERC20Token, MyERC20Token__factory } from "../typechain";
import { TokenSale } from "../typechain/contracts/TokenSale.sol";
import { TokenSale__factory } from "../typechain/factories/contracts/TokenSale.sol";

const ERC20_ETH_RATIO = 1;

describe("NFT Shop", async () => {
  let tokenSaleContract: TokenSale;
  let paymentTokenContract: MyERC20Token;
  let accounts: SignerWithAddress[];

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    // const tokenSaleFactory = await ethers.getContractFactory("TokenSale");
    const tokenSaleFactory = new TokenSale__factory(accounts[0]);
    const myERC20Factory = new MyERC20Token__factory(accounts[0]);

    paymentTokenContract = await myERC20Factory.deploy();
    await paymentTokenContract.deployed();

    tokenSaleContract = await tokenSaleFactory.deploy(paymentTokenContract.address, ERC20_ETH_RATIO);
    await tokenSaleContract.deployed();

    const MINTER_ROLE = await paymentTokenContract.MINTER_ROLE();
    const giveRoleTx = await paymentTokenContract.grantRole(MINTER_ROLE, tokenSaleContract.address);
    await giveRoleTx.wait();
  });

  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.equal(ERC20_ETH_RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      const erc20TokenAddress = await tokenSaleContract.paymentToken();
      await expect(paymentTokenContract.totalSupply()).not.to.be.reverted;
      await expect(paymentTokenContract.balanceOf(accounts[0].address)).not.to.be.reverted;
    });
  });

  describe("When a user purchase an ERC20 from the Token contract", async () => {
    const ETH_SENT = ethers.utils.parseEther("1");
    let userReceivedERC20: BigNumber;
    let userBalanceBefore: BigNumber;

    beforeEach(async () => {
      userBalanceBefore = await accounts[0].getBalance();
      const purhcaseTx = await tokenSaleContract.purchaseTokens({
        value: ETH_SENT,
      });
      await purhcaseTx.wait();

      userReceivedERC20 = await paymentTokenContract.balanceOf(accounts[0].address);
    });

    it("charges the correct amount of ETH", async () => {
      const contractBalance = await ethers.provider.getBalance(tokenSaleContract.address);
      expect(contractBalance).to.equal(ETH_SENT);
    });

    it("gives the correct amount of tokens", async () => {
      expect(userReceivedERC20).to.equal(ETH_SENT.div(ERC20_ETH_RATIO));
    });
  });

  describe("When a user burns an ERC20 at the Token contract", async () => {
    // const ETH_SENT = ethers.utils.parseEther("1");
    // const ERC20_TO_BURN = 0.5;
    // let totalERC20SupplyBefore: BigNumber;
    // let totalERC20SupplyAfter: BigNumber;

    beforeEach(async () => {
      // const purchaseTx = await tokenSaleContract.purchaseTokens({
      //   value: ETH_SENT,
      // });
      // await purchaseTx.wait();
      // totalERC20SupplyBefore = await paymentTokenContract.totalSupply();
      // const burnTx = await tokenSaleContract.burnTokens(ERC20_TO_BURN);
      // await burnTx.wait();
      // totalERC20SupplyAfter = await paymentTokenContract.totalSupply();
    });

    it("gives the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("burns the correct amount of tokens", async () => {
      // expect(totalERC20SupplyBefore.sub(totalERC20SupplyAfter)).to.equal(
      //   ERC20_TO_BURN
      // );
    });
  });

  describe("When a user purchase a NFT from the Shop contract", async () => {
    it("charges the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner account correctly", async () => {
      throw new Error("Not implemented");
    });

    it("update the pool account correctly", async () => {
      throw new Error("Not implemented");
    });

    it("favors the pool with the rounding", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When a user burns their NFT at the Shop contract", async () => {
    it("gives the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
    it("updates the pool correctly", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When the owner withdraw from the Shop contract", async () => {
    it("recovers the right amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner account correctly", async () => {
      throw new Error("Not implemented");
    });
  });
});
