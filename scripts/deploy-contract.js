async function main() {
  const DECKNFT = await hre.ethers.getContractFactory('DECKNFT');
  const contract = await DECKNFT.deploy();

  await contract.deployed();

  console.log('DECK NFT deployed to:', contract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
