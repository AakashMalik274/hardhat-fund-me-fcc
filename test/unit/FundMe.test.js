//chai is being overwritten by waffle
const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe
          let mockV3Aggregator

          let deployer
          const sendValue = ethers.utils.parseEther("1") //1e18 wei or 1ETH

          beforeEach(async function() {
              deployer = (await getNamedAccounts()).deployer

              //deployments.fixture() is use to run all scripts in the deploy folder and we give tags as parameter to it
              await deployments.fixture("all")

              //Now, we'll get the fundMe contract
              //ethers.getContract() gets the most recent deployment of the specified contract and with deployer
              //as the second parmeter. every transaction will be signed by the deployer
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", function() {
              it("sets the aggregator address correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(
                      response,
                      mockV3Aggregator.address,
                      "Aggregator is not setting properly"
                  )
              })
          })
          describe("fund", () => {
              it("should fail if you don't send enough ETH", async () => {
                  //expect().to.be.reverted is used to say "Yes, we are expecting it to give that error"
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("should update amount funded data-structure", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("should update funders array", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response, deployer)
              })
          })
          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single funder", async () => {
                  //arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //act

                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)

                  // const gasUsedd = await txReceipt.gasUsed
                  // const gasPrice = await txReceipt.effectiveGasPrice

                  const { gasUsed, effectiveGasPrice } = txReceipt

                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw from multiple funders", async () => {
                  //arrange
                  const accounts = await ethers.getSigners() //creating a bunch of accounts

                  for (let i = 1; i < 6; i++) {
                      //starting from 1 as 0th account is deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //act

                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  //assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //making sure funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      const response = await fundMe.getAddressToAmountFunded(
                          accounts[i].address
                      )
                      assert.equal(response.toString(), "0")
                  }
              })
              it("only allows the owner to withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  // for (let i = 0; i < 6; i++) {
                  //     const connectedFundMeContract = await fundMe.connect(
                  //         accounts[i]
                  //     )
                  //     if (i != 0) {
                  //         await expect(connectedFundMeContract.withdraw()).to.be
                  //             .reverted
                  //     }
                  // }
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaper withdraw...", async () => {
                  //arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //act

                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)

                  // const gasUsedd = await txReceipt.gasUsed
                  // const gasPrice = await txReceipt.effectiveGasPrice

                  const { gasUsed, effectiveGasPrice } = txReceipt

                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("cheaper withdraw multiple", async () => {
                  //arrange
                  const accounts = await ethers.getSigners() //creating a bunch of accounts

                  for (let i = 1; i < 6; i++) {
                      //starting from 1 as 0th account is deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //act

                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  //assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //making sure funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      const response = await fundMe.getAddressToAmountFunded(
                          accounts[i].address
                      )
                      assert.equal(response.toString(), "0")
                  }
              })
          })
      })
