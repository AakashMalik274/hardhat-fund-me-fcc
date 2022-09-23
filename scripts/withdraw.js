const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)

    console.log("Withdrawing...")
    const txResponse = await fundMe.withdraw()
    await txResponse.wait(1)

    console.log("Got it Back!!")
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
