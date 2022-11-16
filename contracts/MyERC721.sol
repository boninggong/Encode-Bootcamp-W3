// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyERC721Token is ERC721, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  constructor() ERC721("GameItem", "ITM") {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
  }

  function safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) {
    _safeMint(to, tokenId);
  }

  // Functions requiring overrides
  function supportsInterface(bytes4 interafceId)
    public
    view
    override(ERC721, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interafceId);
  }
}
