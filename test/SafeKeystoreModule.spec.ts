import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ContractTransaction, JsonRpcProvider, parseEther } from 'ethers'

import execKeystoreTransaction from './helpers/execKeystoreTransaction'
import execTransaction from './helpers/execSafeTransaction'
import setup from './helpers/setup'
import { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider'
import { TestToken } from '../typechain-types'

const DEAD_SAFE_ADDR = "0x00000000000000000000000000000000dEad5Afe"
const RECIPIENT_ADDR = "0x2Ac922ceC780521F8fFAb57D26B407936C352b82"

const getETHBalance = async (provider: JsonRpcProvider | HardhatEthersProvider, accountAddr: string) => {
    return provider.getBalance(accountAddr)
}

const getERC20Balance = async (token: TestToken, accountAddr: string) => {
    return token.balanceOf(accountAddr)
}

describe('SafeKeystoreModule', () => {

    it('Enables SafeKeystore module on a Safe', async () => {
        const { safeL2, safeKeystoreModule, ownerL2 } = await loadFixture(setup)

        const keystoreModuleAddress = await safeKeystoreModule.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(keystoreModuleAddress), ownerL2)

        // Check if KeystoreModule is enabled
        expect(await safeL2.isModuleEnabled(keystoreModuleAddress)).to.equal(true)
    })

    it('Registers a keystore to SafeKeystore module', async () => {
        const { safeL1, safeL2, safeKeystoreModule, ownerL2 } = await loadFixture(setup)

        const keystoreModuleAddress = await safeKeystoreModule.getAddress()
        const safeL2Address = await safeL2.getAddress()
        const safeL1Address = await safeL1.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(keystoreModuleAddress), ownerL2)

        // Register SafeL1 as Keystore for SafeL2
        await execTransaction(safeL2, await safeKeystoreModule.registerKeystore.populateTransaction(safeL1Address), ownerL2)

        // Check if a Keystore is registered and the nonce set to 0
        expect(await safeKeystoreModule.getKeystore(safeL2Address)).to.equal(safeL1Address)
        expect(await safeKeystoreModule.getNonce(safeL2Address)).to.equal(0)

        // Check if the owners has been changed to DEAD_SAFE and the threashold to 1
        const owners = await safeL2.getOwners();
        expect(owners.length).to.equal(1)
        expect(owners[0]).to.equal(DEAD_SAFE_ADDR)

        const threshold = await safeL2.getThreshold()
        expect(threshold).to.equal(1)
    })

    it('Executes ETH transfer via SafeKeystore module (inherit state from another state)', async () => {
        const { provider, safeL1, safeL2, safeKeystoreModule, owner1L1, owner2L1, ownerL2 } = await loadFixture(setup)

        const safeL2Address = await safeL2.getAddress()
        const safeL1Address = await safeL1.getAddress()
        const keystoreModuleAddress = await safeKeystoreModule.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(keystoreModuleAddress), ownerL2)

        // Register SafeL1 as Keystore for SafeL2
        await execTransaction(safeL2, await safeKeystoreModule.registerKeystore.populateTransaction(safeL1Address), ownerL2)

        // Execute a transaction through safeKeystoreModule
        const amount = parseEther("0.1")
        await execKeystoreTransaction(safeKeystoreModule, {
            safeL2: safeL2Address,
            to: RECIPIENT_ADDR,
            value: amount,
            data: "0x",
            operation: 0, // CALL
            signersL1: [owner1L1, owner2L1]
        })

        // Check recipient should have received 0.1 ETH
        expect(await getETHBalance(provider, RECIPIENT_ADDR)).to.equal(amount)

        // Check the nonce has been incremented
        expect(await safeKeystoreModule.getNonce(safeL2Address)).to.equal(1)
    })

    it('Executes ERC20 transfer via SafeKeystore module (inherit state from another state)', async () => {
        const { safeL1, safeL2, safeKeystoreModule, owner1L1, owner2L1, ownerL2, token } = await loadFixture(setup)

        const safeL2Address = await safeL2.getAddress()
        const safeL1Address = await safeL1.getAddress()
        const tokenAddress = await token.getAddress()
        const keystoreModuleAddress = await safeKeystoreModule.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(keystoreModuleAddress), ownerL2)

        // Register SafeL1 as Keystore for SafeL2
        await execTransaction(safeL2, await safeKeystoreModule.registerKeystore.populateTransaction(safeL1Address), ownerL2)

        // Execute a transaction through safeKeystoreModule
        const amount = "10"
        const { data } = await token.transfer.populateTransaction(RECIPIENT_ADDR, 10)
        await execKeystoreTransaction(safeKeystoreModule, {
            safeL2: safeL2Address,
            to: tokenAddress,
            value: 0,
            data: data,
            operation: 0, // CALL
            signersL1: [owner1L1, owner2L1]
        })

        // Check recipient should have received 10 TT
        expect(await getERC20Balance(token, RECIPIENT_ADDR)).to.equal(amount)

        // Check the nonce has been incremented
        expect(await safeKeystoreModule.getNonce(safeL2Address)).to.equal(1)
    })
})