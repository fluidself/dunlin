const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('DECKNFT', function () {
  const mockTokenURI = 'https://mocktokenuri.com';
  let contract;
  let user;

  beforeEach(async function () {
    const DECKNFT = await ethers.getContractFactory('DECKNFT');
    contract = await DECKNFT.deploy();
    await contract.deployed();

    [, user] = await ethers.getSigners();
  });

  it('should require a tokenURI', async function () {
    await expect(contract.createToken('')).to.be.revertedWith('tokenURI cannot be empty');
  });

  it('should let users mint tokens', async function () {
    await expect(contract.connect(user).createToken(mockTokenURI)).to.emit(contract, 'TokenMinted');

    expect(await contract.balanceOf(await user.getAddress())).to.eq(1);
    expect(await contract.tokenURI(1)).to.eq(mockTokenURI);
    expect(await contract.ownerOf(1)).to.eq(await user.getAddress());
    expect(await contract.tokenURIToTokenId(mockTokenURI)).to.eq(1);
  });
});
