# Week 3

This repository contains my work as part of Week 3 within the [Encode Solidity Bootcamp](https://www.encode.club/solidity-bootcamps), which is a selective 8 week intensive Bootcamp in which Solidity and blockchain programming is taught.

We have implemented a [votable ERC20 contract](https://github.com/boninggong/Encode-Bootcamp-W3/blob/main/contracts/ERC20Votes.sol) that can be used to vote on [tokenized ballots](https://github.com/boninggong/Encode-Bootcamp-W3/blob/main/contracts/TokenizedBallot.sol).

[Deployment scripts](https://github.com/boninggong/Encode-Bootcamp-W3/tree/main/deploy) have been developed to deploy these on the Goerli network.

Deploy ERC20Votes contract go Goerli:

```typescript
yarn hardhat deploy --network goerli --tags ERC20Votes
```

Deploy TokenizedBallot contract go Goerli:

```typescript
yarn hardhat deploy --network goerli --tags TokenizedBallot
```

[Function call scripts](https://github.com/boninggong/Encode-Bootcamp-W3/tree/main/scripts) have been developed to interact with deployed instances on the Goerli network.

Examples to interact with the contracts are:

Mint 100 MTK ERC20 tokens:

```typescript
yarn run ts-node scripts/CallERC20VotesFunctions.ts 0xA1D703118fe5b3C2dC00835d6169e448B7e8183C mint 0x1337A77B69027114d6bCDCA81A617Eb0d5FAE75c 100
```

Delegate to activate votes:

```typescript
yarn run ts-node scripts/CallERC20VotesFunctions.ts 0xA1D703118fe5b3C2dC00835d6169e448B7e8183C delegate 0x1337A77B69027114d6bCDCA81A617Eb0d5FAE75c
```

Cast vote using 100 weight (MTK tokens) to proposal 2:

```typescript
yarn run ts-node scripts/CallTokenizedBallotFunctions.ts 0xD6771480e78fc5979634362D8f15063Ddc2e3b95 vote 1 100
```

An instance of the ERC20 voting contract has been deployed to Goerli at [0xA1D703118fe5b3C2dC00835d6169e448B7e8183C](https://goerli.etherscan.io/address/0xa1d703118fe5b3c2dc00835d6169e448b7e8183c) and the Tokenized ballot contract at [0xD6771480e78fc5979634362D8f15063Ddc2e3b95](https://goerli.etherscan.io/address/0xd6771480e78fc5979634362d8f15063ddc2e3b95)
