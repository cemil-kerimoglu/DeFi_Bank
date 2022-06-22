const Token = artifacts.require("Token");
const DefiBank = artifacts.require("Defi_Bank");
const { assert } = require("chai");
const helper = require("../helpers/truffleTestHelper.js");

require('chai')
    .use(require('chai-as-promised'))
    .should()

    contract('Decentralized Bank', (accounts) =>  {
        
        let token
        let defiBank
        let depositAmounts = []
        let depositTimes = []
        const gasPrice = 20000000000

        before(async () => {
            token = await Token.new()
            defiBank = await DefiBank.new(token.address)
            await token.passMinterRole( defiBank.address,  { from: accounts[0] })
        })

        describe("Testing Helper Functions", async () => {
            it("advances the blockchain forward a block", async () => {
                const originalBlockNumber = await web3.eth.getBlockNumber()    // ('latest').then(x => {return x.hash})
                let newBlockNumber = await web3.eth.getBlockNumber()    // ('latest').then(x => {return x.hash})
                newBlockNumber = await helper.advanceBlock()
                assert.equal(newBlockNumber, (originalBlockNumber + 1))
            })
        })

        describe("Token", async () => {
            it("has the correct name", async () => {
                const tokenName = await token.name()
                assert.equal(tokenName, "Dogemoon")
            })

            it('has the correct symbol', async () => {
                const tokenSymbol = await token.symbol()
                assert.equal(tokenSymbol, 'DGMN')
            })

            it('has passed the minter role to the Defi Bank', async () => {
                const minterRole = await token.minter()
                assert.equal(minterRole, defiBank.address)
            })

            it('does not allow someone else to change the minter', async () => {
                await token.passMinterRole( accounts[2],  { from: accounts[2] }).should.be.rejected
            })

        })

        describe('Decentralized Bank', async () => {
            it('does not allow deposits below 0.01 ETH', async () => {
                await defiBank.deposit({from: accounts[6], value: web3.utils.toWei('0.009', 'ether')}).should.be.rejected        
            })

            it('makes the first deposit', async () => {
                balanceDepositerBefore = await web3.eth.getBalance(accounts[6])
                balanceDepositerBefore = parseFloat(web3.utils.fromWei(balanceDepositerBefore, 'ether'))
                let deposit = await defiBank.deposit({from: accounts[6], value: web3.utils.toWei('0.2', 'ether'), gasPrice: gasPrice}) 
                let depositer = accounts[6]
                let depositAmount = await defiBank.depositUpdateAmount(depositer, 0)
                let depositTime = await defiBank.depositUpdateTime(depositer, 0)
                depositAmounts.push( Number(depositAmount) )
                depositTimes.push( Number(depositTime) )
                assert.equal(depositAmount, web3.utils.toWei('0.2', 'ether'))
                let blockNumber = deposit.receipt.blockNumber
                let block = await web3.eth.getBlock(blockNumber) 
                assert.equal(depositTime, block.timestamp)
                let isEarningInterest = await defiBank.earningInterest(depositer)
                assert.equal(isEarningInterest, true)
                let gasUsed = deposit.receipt.gasUsed
                gasFee = gasPrice * gasUsed
                gasFee = parseFloat(web3.utils.fromWei(gasFee.toString(), 'ether'))
                balanceDepositerAfter = await web3.eth.getBalance(accounts[6])
                balanceDepositerAfter = parseFloat(web3.utils.fromWei(balanceDepositerAfter, 'ether'))
                let amountDeposited = 0.2
                assert.equal(Math.floor(balanceDepositerAfter*1000)/1000, (Math.floor((balanceDepositerBefore - amountDeposited - gasFee)*1000)/1000))
            })

            it('the same account makes additional deposits', async () => {
                balanceDepositerBefore = await web3.eth.getBalance(accounts[6])
                balanceDepositerBefore = parseFloat(web3.utils.fromWei(balanceDepositerBefore, 'ether'))
                let secondDeposit = await defiBank.deposit({from: accounts[6], value: web3.utils.toWei('1', 'ether'), gasPrice: gasPrice}) 
                let depositer = accounts[6]
                let depositAmount = await defiBank.depositUpdateAmount(depositer, 1)
                let depositTime = await defiBank.depositUpdateTime(depositer, 1)
                depositAmounts.push( Number(depositAmount) )
                depositTimes.push( Number(depositTime) )
                assert.equal(depositAmount, web3.utils.toWei('1.2', 'ether'))   
                let newBlockNumber = secondDeposit.receipt.blockNumber
                let newBlock = await web3.eth.getBlock(newBlockNumber) 
                assert.equal(depositTime, newBlock.timestamp)     
                let gasUsed = secondDeposit.receipt.gasUsed
                gasFee = gasPrice * gasUsed
                gasFee = parseFloat(web3.utils.fromWei(gasFee.toString(), 'ether'))
                balanceDepositerAfter = await web3.eth.getBalance(accounts[6])
                balanceDepositerAfter = parseFloat(web3.utils.fromWei(balanceDepositerAfter, 'ether'))
                let amountDeposited = 1.0
                assert.equal(Math.floor(balanceDepositerAfter*1000)/1000, (Math.floor((balanceDepositerBefore - amountDeposited - gasFee)*1000)/1000))
            })
            
            it('withdraws some amount', async () => {
                balanceDepositerBefore = await web3.eth.getBalance(accounts[6])
                balanceDepositerBefore = parseFloat(web3.utils.fromWei(balanceDepositerBefore, 'ether'))
                let firstWithdrawal = await defiBank.withdraw( web3.utils.toWei('0.5', 'ether'), {from: accounts[6], gasPrice: gasPrice}) 
                let depositer = accounts[6]
                let depositAmount = await defiBank.depositUpdateAmount(depositer, 2)
                let withdrawalTime = await defiBank.depositUpdateTime(depositer, 2)
                depositAmounts.push( Number(depositAmount) )
                depositTimes.push( Number(withdrawalTime) )
                assert.equal(depositAmount, web3.utils.toWei('0.7', 'ether'))   
                let newBlockNumber = firstWithdrawal.receipt.blockNumber
                let newBlock = await web3.eth.getBlock(newBlockNumber) 
                assert.equal(withdrawalTime, newBlock.timestamp)   
                let gasUsed = firstWithdrawal.receipt.gasUsed
                gasFee = gasPrice * gasUsed
                gasFee = parseFloat(web3.utils.fromWei(gasFee.toString(), 'ether'))
                balanceDepositerAfter = await web3.eth.getBalance(accounts[6])
                balanceDepositerAfter = parseFloat(web3.utils.fromWei(balanceDepositerAfter, 'ether'))
                let amountWithdrawn = 0.5
                assert.equal(Math.floor(balanceDepositerAfter*1000)/1000, (Math.floor((balanceDepositerBefore + amountWithdrawn - gasFee)*1000)/1000))
            })

            it('withdraws the rest', async () => {
                balanceDepositerBefore = await web3.eth.getBalance(accounts[6])
                balanceDepositerBefore = parseFloat(web3.utils.fromWei(balanceDepositerBefore, 'ether'))
                let completeWithdrawal = await defiBank.withdraw( web3.utils.toWei('0.7', 'ether'), {from: accounts[6], gasPrice: gasPrice}) 
                let depositer = accounts[6]
                let depositAmount = await defiBank.depositUpdateAmount(depositer, 3)
                let withdrawalTime = await defiBank.depositUpdateTime(depositer, 3)
                depositAmounts.push( Number(depositAmount) )
                depositTimes.push( Number(withdrawalTime) )
                assert.equal(depositAmount, web3.utils.toWei('0', 'ether'))
                let newBlockNumber = completeWithdrawal.receipt.blockNumber
                let newBlock = await web3.eth.getBlock(newBlockNumber) 
                assert.equal(withdrawalTime, newBlock.timestamp)   
                let gasUsed = completeWithdrawal.receipt.gasUsed
                gasFee = gasPrice * gasUsed
                gasFee = parseFloat(web3.utils.fromWei(gasFee.toString(), 'ether'))
                balanceDepositerAfter = await web3.eth.getBalance(accounts[6])
                balanceDepositerAfter = parseFloat(web3.utils.fromWei(balanceDepositerAfter, 'ether'))
                let amountWithdrawn = 0.7
                assert.equal(Math.floor(balanceDepositerAfter*1000)/1000, (Math.floor((balanceDepositerBefore + amountWithdrawn - gasFee)*1000)/1000))
            })

            it('does not pay interest to the wrong customer', async () => {
                await defiBank.earnInterest({from: accounts[3]}).should.be.rejected
                let interest = await token.balanceOf(accounts[3])
                assert.equal(interest, '0')
            })
        
            it('pays the correct amount of interest to the right customer', async () => {
                let interestTransaction = await defiBank.earnInterest({from: accounts[6]})
                let newBlockNumber = interestTransaction.receipt.blockNumber
                let newBlock = await web3.eth.getBlock(newBlockNumber) 
                let interest = await token.balanceOf(accounts[6])
                interest = Number(interest)
                let interestToBePaid = 0;
                for (let i = 0; i < (depositAmounts.length - 1); i++) {
                    interestToBePaid = interestToBePaid + ( 31668017 * (depositAmounts[i] / 1e16) * (depositTimes[i+1] - depositTimes[i]) )
                }
                interestToBePaid = interestToBePaid + ( 31668017 * (depositAmounts[(depositAmounts.length - 1)] / 1e16) * (newBlock.timestamp - depositTimes[(depositTimes.length - 1)]) )
                assert.equal(Math.floor(interest*1000)/1000, Math.floor(interestToBePaid*1000)/1000)  
                assert.equal(depositAmounts.length, 0)
                assert.equal(depositTimes.length, 0)
            })
            
        })   

    })







    