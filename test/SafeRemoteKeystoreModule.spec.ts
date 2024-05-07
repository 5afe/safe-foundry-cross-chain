import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { JsonRpcProvider, parseEther } from 'ethers'

import execKeystoreTransaction from './helpers/execKeystoreTransaction'
import execTransaction from './helpers/execSafeTransaction'
import setup from './helpers/setup'
import { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider'
import { TestToken } from '../typechain-types'
import { ethers } from 'hardhat'

const GUARD_SLOT = "0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8"
const RECIPIENT_ADDR = "0x2Ac922ceC780521F8fFAb57D26B407936C352b82"

const getETHBalance = async (provider: JsonRpcProvider | HardhatEthersProvider, accountAddr: string) => {
    return provider.getBalance(accountAddr)
}

const getERC20Balance = async (token: TestToken, accountAddr: string) => {
    return token.balanceOf(accountAddr)
}

describe('SafeRemoteKeystoreModule', () => {

    it('Enables SafeRemoteKeystore module on a Safe', async () => {
        const { safeL2, safeRemoteKeystoreModule, ownerL2 } = await loadFixture(setup)

        const safeRemoteKeystoreModuleAddress = await safeRemoteKeystoreModule.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(safeRemoteKeystoreModuleAddress), ownerL2)

        // Check if KeystoreModule is enabled
        expect(await safeL2.isModuleEnabled(safeRemoteKeystoreModuleAddress)).to.equal(true)
    })

    it('Registers a keystore to SafeRemoteKeystore module', async () => {
        const { safeL1, safeL2, safeRemoteKeystoreModule, safeDisableLocalKeystoreGuard, ownerL2 } = await loadFixture(setup)

        const safeRemoteKeystoreModuleAddress = await safeRemoteKeystoreModule.getAddress()
        const safeDisableLocalKeystoreGuardAddress = await safeDisableLocalKeystoreGuard.getAddress()
        const safeL2Address = await safeL2.getAddress()
        const safeL1Address = await safeL1.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(safeRemoteKeystoreModuleAddress), ownerL2)

        // Register SafeL1 as Keystore for SafeL2
        await execTransaction(safeL2, await safeRemoteKeystoreModule.registerKeystore.populateTransaction(safeL1Address, safeDisableLocalKeystoreGuardAddress), ownerL2)

        // Check if a Keystore is registered and the nonce set to 0
        expect(await safeRemoteKeystoreModule.getKeystore(safeL2Address)).to.equal(safeL1Address)
        expect(await safeRemoteKeystoreModule.getNonce(safeL2Address)).to.equal(0)

        // Check if the guard is linked
        const guardStorage = await safeL2.getStorageAt(GUARD_SLOT, 1)
        const guard = ethers.AbiCoder.defaultAbiCoder().decode(
            ['address'],
            guardStorage
        ).toString()
        expect(guard).to.equal(safeDisableLocalKeystoreGuardAddress)

        // Traditional safe.execTransaction should fail due to the guard
        await expect(execTransaction(safeL2, { to: RECIPIENT_ADDR, value: parseEther("0.1"), data: "0x" }, ownerL2))
            .to.be.revertedWith("This call is restricted, use safeRemoteKeystoreModule.execTransaction instead.");
    })

    it('Executes ETH transfer via SafeRemoteKeystore module', async () => {
        const { provider, safeL1, safeL2, safeRemoteKeystoreModule, safeDisableLocalKeystoreGuard, owner1L1, owner2L1, ownerL2 } = await loadFixture(setup)

        const safeL2Address = await safeL2.getAddress()
        const safeL1Address = await safeL1.getAddress()
        const safeRemoteKeystoreModuleAddress = await safeRemoteKeystoreModule.getAddress()
        const safeDisableLocalKeystoreGuardAddress = await safeDisableLocalKeystoreGuard.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(safeRemoteKeystoreModuleAddress), ownerL2)

        // Register SafeL1 as Keystore for SafeL2
        await execTransaction(safeL2, await safeRemoteKeystoreModule.registerKeystore.populateTransaction(safeL1Address, safeDisableLocalKeystoreGuardAddress), ownerL2)

        // Execute a transaction through safeRemtoteKeystoreModule
        const amount = parseEther("0.1")
        await execKeystoreTransaction(safeRemoteKeystoreModule, {
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
        expect(await safeRemoteKeystoreModule.getNonce(safeL2Address)).to.equal(1)
    })

    it('Executes ERC20 transfer via SafeRemoteKeystore module', async () => {
        const { safeL1, safeL2, safeRemoteKeystoreModule, safeDisableLocalKeystoreGuard, owner1L1, owner2L1, ownerL2, token } = await loadFixture(setup)

        const safeL2Address = await safeL2.getAddress()
        const safeL1Address = await safeL1.getAddress()
        const tokenAddress = await token.getAddress()
        const safeRemoteKeystoreModuleAddress = await safeRemoteKeystoreModule.getAddress()
        const safeDisableLocalKeystoreGuardAddress = await safeDisableLocalKeystoreGuard.getAddress()

        // Enable KeyStoreModule as module on SafeL2
        await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(safeRemoteKeystoreModuleAddress), ownerL2)

        // Register SafeL1 as Keystore for SafeL2
        await execTransaction(safeL2, await safeRemoteKeystoreModule.registerKeystore.populateTransaction(safeL1Address, safeDisableLocalKeystoreGuardAddress), ownerL2)

        // Execute a transaction through safeKeystoreModule
        const amount = "10"
        const { data } = await token.transfer.populateTransaction(RECIPIENT_ADDR, 10)
        await execKeystoreTransaction(safeRemoteKeystoreModule, {
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
        expect(await safeRemoteKeystoreModule.getNonce(safeL2Address)).to.equal(1)
    })
})