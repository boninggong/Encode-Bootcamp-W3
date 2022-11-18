import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { exec } from "child_process";
import exp from "constants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { MyERC20Token, MyERC20Token__factory, MyERC721Token, MyERC721Token__factory } from "../typechain";
import { token } from "../typechain/@openzeppelin/contracts";
import { TokenSale } from "../typechain/contracts/TokenSale.sol";
import { TokenSale__factory } from "../typechain/factories/contracts/TokenSale.sol";

const ERC20_ETH_RATIO = 1;
const NFT_PRICE = ethers.utils.parseEther("0.2");

describe("NFT Shop", async () => {
  let tokenSaleContract: TokenSale;
  let paymentTokenContract: MyERC20Token;
  let nftTokenContract: MyERC721Token;
  let accounts: SignerWithAddress[];

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const tokenSaleFactory = new TokenSale__factory(accounts[0]);
    const myERC20Factory = new MyERC20Token__factory(accounts[0]);
    const myERC721Factory = new MyERC721Token__factory(accounts[0]);

    paymentTokenContract = await myERC20Factory.deploy();
    await paymentTokenContract.deployed();

    nftTokenContract = await myERC721Factory.deploy();
    await nftTokenContract.deployed();

    tokenSaleContract = await tokenSaleFactory.deploy(
      paymentTokenContract.address,
      ERC20_ETH_RATIO,
      nftTokenContract.address,
      NFT_PRICE,
    );
    await tokenSaleContract.deployed();

    const MINTER_ROLE = await paymentTokenContract.MINTER_ROLE();
    const giveRoleTx = await paymentTokenContract.grantRole(MINTER_ROLE, tokenSaleContract.address);
    await giveRoleTx.wait();

    const MINTER_ROLE_NFT = await nftTokenContract.MINTER_ROLE();
    const giveRoleNFTTx = await nftTokenContract.grantRole(MINTER_ROLE_NFT, tokenSaleContract.address);
    await giveRoleNFTTx.wait();
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
    let balanceBefore: BigNumber;
    let totalERC20SupplyBefore: BigNumber;
    let gasCost: BigNumber;

    beforeEach(async () => {
      balanceBefore = await accounts[0].getBalance();
      totalERC20SupplyBefore = await paymentTokenContract.totalSupply();

      const purhcaseTx = await tokenSaleContract.purchaseTokens({
        value: ETH_SENT,
      });
      const receipt = await purhcaseTx.wait();
      const gasUsage = receipt.gasUsed;
      const gasPrice = receipt.effectiveGasPrice;
      gasCost = gasUsage.mul(gasPrice);
    });

    it("charges the correct amount of ETH", async () => {
      const balanceAfter = await accounts[0].getBalance();
      const expectedBalance = balanceBefore.sub(ETH_SENT).sub(gasCost);
      const error = expectedBalance.sub(balanceAfter);
      expect(error).to.equal(0);
    });

    it("gives the correct amount of tokens", async () => {
      const userReceivedERC20 = await paymentTokenContract.balanceOf(accounts[0].address);
      expect(userReceivedERC20).to.equal(ETH_SENT.div(ERC20_ETH_RATIO));
    });

    describe("When a user burns an ERC20 at the Token contract", async () => {
      const ERC20_TO_BURN = ethers.utils.parseEther("1");
      let balanceBeforeBurn: BigNumber;
      let totalERC20SupplyAfter: BigNumber;
      let gasCost: BigNumber;

      beforeEach(async () => {
        balanceBeforeBurn = await accounts[0].getBalance();

        const allowBurnTx = await paymentTokenContract.approve(tokenSaleContract.address, ERC20_TO_BURN);
        const receiptAllow = await allowBurnTx.wait();

        const burnTx = await tokenSaleContract.burnTokens(ERC20_TO_BURN);
        const receiptBurn = await burnTx.wait();

        gasCost = receiptAllow.gasUsed
          .mul(receiptAllow.effectiveGasPrice)
          .add(receiptBurn.gasUsed.mul(receiptBurn.effectiveGasPrice));

        totalERC20SupplyAfter = await paymentTokenContract.totalSupply();
      });

      it("gives the correct amount of ETH", async () => {
        const balanceAfterBurn = await accounts[0].getBalance();
        const expectedBalance = balanceBeforeBurn.sub(gasCost).add(ERC20_TO_BURN.mul(ERC20_ETH_RATIO));
        const error = expectedBalance.sub(balanceAfterBurn);
        expect(error).to.equal(0);
      });

      it("burns the correct amount of tokens", async () => {
        const balanceBN = await paymentTokenContract.balanceOf(accounts[0].address);
        expect(balanceBN.toNumber()).to.equal(0);
      });
    });

    describe("When a user purchase a NFT from the Shop contract", async () => {
      const NFT_ID = 42;
      let tokenBalanceBefore: BigNumber;

      beforeEach(async () => {
        tokenBalanceBefore = await paymentTokenContract.balanceOf(accounts[0].address);

        const allowNftTx = await paymentTokenContract.approve(tokenSaleContract.address, ETH_SENT.div(ERC20_ETH_RATIO));
        await allowNftTx.wait();

        const purchaseTx = await tokenSaleContract.purchaseNFT(NFT_ID);
        await purchaseTx.wait();
      });

      it("charges the correct amount of tokens", async () => {
        const tokenBalanceAfter = await paymentTokenContract.balanceOf(accounts[0].address);
        const expectedTokenBalanceAfter = tokenBalanceBefore.sub(NFT_PRICE);
        const error = expectedTokenBalanceAfter.sub(tokenBalanceAfter);
        expect(error).to.equal(0);
      });

      it("updates the owner account correctly", async () => {
        const ownerOfToken = await nftTokenContract.ownerOf(NFT_ID);
        expect(ownerOfToken).to.equal(accounts[0].address);
      });

      it("update the pool account correctly", async () => {
        const amountInOwnerNFTPool = await tokenSaleContract.ownerNFTPool(accounts[0].address);
        const amountInOwnerWithdrawablePool = await tokenSaleContract.ownerWithdrawablePool(accounts[0].address);
        const expectedAmountInOwnerNFTPool = NFT_PRICE.div(2); // TO-DO: Need to round down
        expect(amountInOwnerNFTPool).to.equal(expectedAmountInOwnerNFTPool);
        expect(amountInOwnerWithdrawablePool).to.equal(NFT_PRICE.sub(expectedAmountInOwnerNFTPool));
      });

      describe("When a user burns their NFT at the Shop contract", async () => {
        let gasCost: BigNumber;
        let userERC20BalanceBefore: BigNumber;

        beforeEach(async () => {
          userERC20BalanceBefore = await paymentTokenContract.balanceOf(accounts[0].address);
          const allowBurnTx = await nftTokenContract.approve(tokenSaleContract.address, NFT_ID);
          const allowBurnReceipt = await allowBurnTx.wait();

          const burnNFTTx = await tokenSaleContract.burnNFT(NFT_ID);
          const burnNFTReceipt = await burnNFTTx.wait();

          gasCost = allowBurnReceipt.gasUsed
            .mul(allowBurnReceipt.effectiveGasPrice)
            .add(burnNFTReceipt.gasUsed.mul(burnNFTReceipt.effectiveGasPrice));
        });

        it("gives the correct amount of ERC20 tokens", async () => {
          let userERC20BalanceAfter = await paymentTokenContract.balanceOf(accounts[0].address);
          const expectedUserERC20BalanceAfter = userERC20BalanceBefore.add(NFT_PRICE.div(2)); // Need to round down
          expect(userERC20BalanceAfter).to.equal(expectedUserERC20BalanceAfter);
        });

        it("updates the pool correctly", async () => {
          const userPoolBalance = await tokenSaleContract.ownerNFTPool(accounts[0].address);
          expect(userPoolBalance).to.equal(0);
        });
      });

      describe("When the owner withdraw from the Shop contract", async () => {
        let userERC20BalanceBefore: BigNumber;

        beforeEach(async () => {
          userERC20BalanceBefore = await paymentTokenContract.balanceOf(accounts[0].address);

          const withdrawTx = await tokenSaleContract.ownerWithdraw();
          const receiptWithdrawTx = withdrawTx.wait();
        });

        it("recovers the right amount of ERC20 tokens", async () => {
          let userERC20BalanceAfter = await paymentTokenContract.balanceOf(accounts[0].address);
          const expectedUserERC20BalanceAfter = userERC20BalanceBefore.add(NFT_PRICE.sub(NFT_PRICE.div(2))); // Need to round down
          expect(userERC20BalanceAfter).to.equal(expectedUserERC20BalanceAfter);
        });

        it("updates the owner account correctly", async () => {
          const newOwnerERC20Balance = await tokenSaleContract.ownerWithdrawablePool(accounts[0].address);
          expect(newOwnerERC20Balance).to.equal(0);
        });
      });
    });
  });
});
