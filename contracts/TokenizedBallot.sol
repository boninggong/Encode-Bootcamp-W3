// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./ERC20Votes.sol";

contract Ballot {
    MyToken public voteToken;
    uint256 public targetBlock;

    // This is a type for a single proposal.
    struct Proposal {
        bytes32 name; // short name (up to 32 bytes)
        uint256 voteCount; // number of accumulated votes
    }

    // A dynamically-sized array of `Proposal` structs.
    Proposal[] public proposals;

    mapping(address => uint256) public votePowerSpent;

    /// Create a new ballot to choose one of `proposalNames`.
    constructor(
        bytes32[] memory proposalNames,
        address _voteToken,
        uint256 _targetBlock
    ) {
        voteToken = MyToken(_voteToken);
        targetBlock = _targetBlock;

        // For each of the provided proposal names,
        // create a new proposal object and add it
        // to the end of the array.
        for (uint256 i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({ name: proposalNames[i], voteCount: 0 }));
        }
    }

    function vote(uint256 proposal, uint256 amount) external {
        require(votePower(msg.sender) >= amount, "Not enough vote power");
        proposals[proposal].voteCount += amount;
        votePowerSpent[msg.sender] += amount;
    }

    /// @dev Computes the winning proposal taking all
    /// previous votes into account.
    function winningProposal() public view returns (uint256 winningProposal_) {
        uint256 winningVoteCount = 0;
        for (uint256 p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function votePower(address account) public view returns (uint256) {
        return voteToken.getPastVotes(account, targetBlock) - votePowerSpent[account];
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the name of the winner
    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
