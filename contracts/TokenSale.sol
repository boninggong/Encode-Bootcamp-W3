// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IMyERC20Token {
    function mint(address to, uint256 amount) external;

    function burn(uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;

    function transfer(address to, uint256 amount) external;

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external;
}

interface IMyERC721Token {
    function safeMint(address to, uint256 tokenId) external;

    function burn(uint256 tokenId) external;
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
    IMyERC721Token public nftToken;

    uint256 public ratio; // 1 ETH = xxx Gold
    uint256 public tokenPriceInWei = 1 ether;
    uint256 public price; // Price of 1 NFT
    uint256 public halfPrice; // 50% of price rounded down to 0 decimals

    mapping(address => uint256) public ownerNFTPool;
    mapping(address => uint256) public ownerWithdrawablePool;

    // Initiating contract with ERC20 and ERC721 tokens
    constructor(
        address _paymentToken,
        uint256 _ratio,
        address _nftToken,
        uint256 _price
    ) {
        paymentToken = IMyERC20Token(_paymentToken);
        ratio = _ratio;
        nftToken = IMyERC721Token(_nftToken);
        price = _price;
        halfPrice = _price / 2;
    }

    function purchaseTokens() external payable {
        uint256 amountToBeMinted = msg.value / ratio;
        paymentToken.mint(msg.sender, amountToBeMinted);
    }

    function burnTokens(uint256 amount) external {
        paymentToken.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount * ratio);
    }

    function purchaseNFT(uint256 tokenId) external payable {
        paymentToken.transferFrom(msg.sender, address(this), price);
        nftToken.safeMint(msg.sender, tokenId);
        ownerNFTPool[msg.sender] += halfPrice;
        ownerWithdrawablePool[msg.sender] += (price - halfPrice);
    }

    function burnNFT(uint256 tokenId) external {
        nftToken.burn(tokenId);
        ownerNFTPool[msg.sender] -= halfPrice;
        paymentToken.transfer(msg.sender, halfPrice);
    }

    function ownerWithdraw() external {
        uint256 ERC20toReturn = ownerWithdrawablePool[msg.sender];
        ownerWithdrawablePool[msg.sender] = 0;
        paymentToken.transfer(msg.sender, ERC20toReturn);
    }
}
