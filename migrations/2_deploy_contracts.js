const VoterApp = artifacts.require("VoterApp");

module.exports = function(deployer) {
	deployer.deploy(VoterApp);
}