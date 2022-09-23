//LAST STEP BEFORE DEPLOYING ON MAINNET
//These are tests for mainnet

const { ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip //skips the whole describe
    : describe("Fund Me", () => {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.01") //1ether or 1e18 wei

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()

              const endingBalance = await ethers.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
