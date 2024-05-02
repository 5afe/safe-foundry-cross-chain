import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { parseUnits, formatEther, JsonRpcProvider, parseEther } from 'ethers'

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
        const safeL1Address = await safeL1.getAddress()
        // const tokenAddress = await token.getAddress()
        const keyStoreModuleAddress = await safeKeystoreModule.getAddress()

        // Check Safes and module configuration
        expect((await safeL1.getOwners())[0]).to.equal(ownerL1.address)
        expect((await safeL2.getOwners())[0]).to.equal(ownerL2.address)
        expect(await safeL2.isModuleEnabled(keyStoreModuleAddress)).to.equal(true)
        expect(await safeKeystoreModule.getKeystore(safeL2Address)).to.equal(safeL1Address)
        expect(await safeKeystoreModule.getNonce(safeL2Address)).to.equal(0)
        
        // Send some ETH to SafeL2
        await ownerL2.sendTransaction({
            to: safeL2Address,
            value: parseEther('1'),
        })

        // Execute a transaction through safeKeystoreModule
        const prevRecipientBal = await getETHBalance(provider, recipient.address)
        const amountETH = parseEther("0.1")
        await execKeystoreTransaction(safeKeystoreModule, {
            safeL2: safeL2Address,
            to: recipient.address,
            amount: amountETH,
            safeL1: safeL1Address,
            signerL1: ownerL1
        })

        // Check recipient should have received 0.1 ETH
        const newRecipientBal = await getETHBalance(provider, recipient.address)
        expect(newRecipientBal).to.equal(prevRecipientBal + amountETH)

        // Check the nonce has been incremented
        expect(await safeKeystoreModule.getNonce(safeL2Address)).to.equal(1)

    })

})