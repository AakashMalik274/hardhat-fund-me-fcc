const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER
} = require("../helper-hardhat-config")

//deployments - contain functions to access past deployments or save new ones
//getNamedAccounts -  retursns an object whose keys are names and values are addresses.
module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log("Local Network Detected!! Deploying Mocks...")
        await deploy("MockV3Aggregator", {
            from: deployer,
            contract: "MockV3Aggregator",
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        })
        log("MOCKS DEPLOYED!!!")
        log(
            "-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-"
        )
    }
}

module.exports.tags = ["all", "mocks"]
