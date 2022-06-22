const Token = artifacts.require("Token");
const DefiBank = artifacts.require("Defi_Bank");

module.exports = async function(deployer) {
	await deployer.deploy(Token)
	const token = await Token.deployed()
	
	await deployer.deploy(DefiBank, token.address)
	const defiBank = await DefiBank.deployed()
	
	await token.passMinterRole(defiBank.address)
};

