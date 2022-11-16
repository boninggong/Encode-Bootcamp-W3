// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IMyERC20Token {
  function mint(address to, uint256 amount) external;

  function burn(address account, uint256 amount) external;

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external;
}

// Application Features
// Buy a ERC20 with ETH for a fixed ratio
// Withdraw ETH by burning the ERC20 tokens
// Buy (Mint) a new ERC721 for a configured price
// Update owner account whenever a NFT is sold
// Allow owner to withdraw from account
// Only half of sales value is available for withdraw
// Allow users to burn their NFTs to recover half of the purchase price

contract TokenSale {
  IMyERC20Token public paymentToken;

  uint256 public ratio; // 1 ETH = xxx Gold
  uint256 public tokenPriceInWei = 1 ether;

  string public ERC721_NAME = "Stamp";
  string public ERC721_SYMBOL = "Stp";

  // Initiating contract with ERC20 and ERC721 tokens
  constructor(address _paymentToken, uint256 _ratio) {
    paymentToken = IMyERC20Token(_paymentToken);
    ratio = _ratio;
  }

  function purchaseTokens() external payable {
    uint256 amountToBeMinted = msg.value / ratio;
    paymentToken.mint(msg.sender, amountToBeMinted);
  }

  function burnTokens(uint256 amount) external {
    paymentToken.transferFrom(msg.sender, address(this), amount);
    paymentToken.burn(msg.sender, amount);
    (bool sent, ) = msg.sender.call{value: amount * ratio}("");
    require(sent, "Failed to send Ether");
  }
}
