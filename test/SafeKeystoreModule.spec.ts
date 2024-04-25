import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { parseUnits, ZeroAddress, formatEther, JsonRpcProvider, parseEther } from 'ethers'
import hre from 'hardhat'

import execKeystoreTransaction from './helpers/execKeystoreTransaction'
import execSafeTransaction from './helpers/execSafeTransaction'
import setup from './helpers/setup'
import { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider'


const OneEther = parseUnits('1', 'ether')

const getETHBalance = async (provider: JsonRpcProvider | HardhatEthersProvider, accountAddr: string) => {
    return provider.getBalance(accountAddr)
}

describe('KeystoreModule', () => {
    it('Execute ETH transfer with delegated configutation from another Safe', async () => {
        const { provider, safeL1, safeL2, safeKeystoreModule, ownerL1, ownerL2, recipient } = await loadFixture(setup)

        const safeL2Address = await safeL2.getAddress()
        // const tokenAddress = await token.getAddress()
        const keyStoreModuleAddress = await safeKeystoreModule.getAddress()

        // Check Safes configuration
        expect((await safeL1.getOwners())[0]).to.equal(ownerL1.address)
        expect((await safeL2.getOwners())[0]).to.equal(ownerL2.address)
        expect(await safeL2.isModuleEnabled(keyStoreModuleAddress)).to.equal(true)

        console.log(`-------`)
        let ownerBalance = await getETHBalance(provider, ownerL2.address)
        console.log(`ownerBalance=${formatEther(ownerBalance)} ETH`)
        let safeL2Balance = await getETHBalance(provider, safeL2Address)
        console.log(`safeBalance=${formatEther(safeL2Balance)} ETH`)

        // Send some ETH to SafeL2
        await ownerL2.sendTransaction({
            to: safeL2Address,
            value: parseUnits('1', 18),
        })

        console.log(`-------`)
        ownerBalance = await getETHBalance(provider, ownerL2.address)
        console.log(`ownerBalance=${formatEther(ownerBalance)} ETH`)
        safeL2Balance = await getETHBalance(provider, safeL2Address)
        console.log(`safeBalance=${formatEther(safeL2Balance)} ETH`)
        console.log(`-------`)

        const prevRecipientBal = await getETHBalance(provider, recipient.address)
        console.log(`prevRecipientBal=${formatEther(prevRecipientBal)} ETH`)
        const amountETH = parseEther("0.1")
        await execKeystoreTransaction(safeKeystoreModule, {
            safeL2: safeL2,
            to: recipient.address,
            amount: amountETH,
            safeL1: safeL1,
            signerL1: ownerL1
        })

        // Check recipient should have received 0.1 ETH
        const newRecipientBal = await getETHBalance(provider, recipient.address)
        console.log(`newRecipientBal=${formatEther(newRecipientBal)} ETH`)
        expect(newRecipientBal).to.equal(prevRecipientBal + amountETH)


    })

})