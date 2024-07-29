import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import execSafeTransaction from '../common/execSafeTransaction'
import setup from './helpers/setup'
import { decodeAbiParameters, encodeFunctionData, fromHex, parseAbiParameters, parseEther } from 'viem'
import { getKeyspaceKey } from './helpers/keybase'
import execSafeKeySpaceTransaction from '../common/execSafeKeySpaceTransaction'
import { extractPublicKeyFromWalletClient, getERC20Balance, getETHBalance } from '../common/utils'

const RECIPIENT_ADDR = "0x2Ac922ceC780521F8fFAb57D26B407936C352b82"

describe('SafeKeySpaceModule', () => {

    it('Enables SafeKeySpace module on a Safe', async () => {
        const { safe, module, owner, clients } = await loadFixture(setup)

        // Enable KeyStoreModule as module on Safe
        await execSafeTransaction({
            safe,
            to: safe.address,
            data: encodeFunctionData({
                abi: safe.abi,
                functionName: 'enableModule',
                args: [module.address]
            }),
            signer: owner,
            clients
        })

        // Check if KeystoreModule is enabled
        expect(await safe.read.isModuleEnabled([module.address])).to.equal(true)
    })

    it('Registers a keystore to SafeKeySpace module', async () => {
        const { safe, module, guard, owner, clients } = await loadFixture(setup)

        // Enable KeyStoreModule as module on Safe
        await execSafeTransaction({
            safe,
            to: safe.address,
            data: encodeFunctionData({
                abi: safe.abi,
                functionName: 'enableModule',
                args: [module.address]
            }),
            signer: owner,
            clients
        })

        // Register keystore on the Safe
        const publicKey = await extractPublicKeyFromWalletClient(owner)
        const keystoreKey = getKeyspaceKey(publicKey)
        await execSafeTransaction({
            safe,
            to: module.address,
            data: encodeFunctionData({
                abi: module.abi,
                functionName: 'registerKeystore',
                args: [fromHex(keystoreKey, "bigint")]
            }),
            signer: owner,
            clients
        })

        // Check if a Keystore is registered and the nonce set to 0
        expect(await module.read.keyspaceKeys([safe.address])).to.equal(fromHex(keystoreKey, "bigint"))
        expect(await module.read.nonces([safe.address])).to.equal(0)

        // Check if the guard is linked
        const guardStorage = await safe.read.getStorageAt([33528237782592280163068556224972516439282563014722366175641814928123294921928n, 1n])
        const [guardVal] = decodeAbiParameters(parseAbiParameters('address'), guardStorage)
        expect(guardVal).to.equal(guard.address)

        // Traditional safe.execTransaction should fail due to the guard
        await expect(execSafeTransaction({ safe, to: RECIPIENT_ADDR, value: parseEther("0.1"), data: "0x", signer: owner, clients }))
            .to.be.rejectedWith("This call is restricted, use SafeKeySpaceModule.execTransaction instead.");
    })

    it('Executes ETH transfer via SafeKeySpace module', async () => {
        const { safe, module, owner, clients } = await loadFixture(setup)

        // Enable KeyStoreModule as module on Safe
        await execSafeTransaction({
            safe,
            to: safe.address,
            data: encodeFunctionData({
                abi: safe.abi,
                functionName: 'enableModule',
                args: [module.address]
            }),
            signer: owner,
            clients
        })

        // Register keystore on the Safe
        const publicKey = await extractPublicKeyFromWalletClient(owner)
        const keystoreKey = getKeyspaceKey(publicKey)
        await execSafeTransaction({
            safe,
            to: module.address,
            data: encodeFunctionData({
                abi: module.abi,
                functionName: 'registerKeystore',
                args: [fromHex(keystoreKey, "bigint")]
            }),
            signer: owner,
            clients
        })

        // Execute a transaction through safeKeySpaceModule
        const amount = parseEther("0.1")
        await execSafeKeySpaceTransaction({
            module,
            safe,
            to: RECIPIENT_ADDR,
            value: amount,
            signer: owner,
            clients
        })

        // Check recipient should have received 0.1 ETH
        expect(await getETHBalance(clients.readClient, RECIPIENT_ADDR)).to.equal(amount)

        // Check the nonce has been incremented
        expect(await module.read.nonces([safe.address])).to.equal(1)
    })

    it('Executes ERC20 transfer via SafeKeySpace module', async () => {
        const { safe, module, owner, testToken, clients } = await loadFixture(setup)

        // Enable KeyStoreModule as module on Safe
        await execSafeTransaction({
            safe,
            to: safe.address,
            data: encodeFunctionData({
                abi: safe.abi,
                functionName: 'enableModule',
                args: [module.address]
            }),
            signer: owner,
            clients
        })

        // Register keystore on the Safe
        const publicKey = await extractPublicKeyFromWalletClient(owner)
        const keystoreKey = getKeyspaceKey(publicKey)
        await execSafeTransaction({
            safe,
            to: module.address,
            data: encodeFunctionData({
                abi: module.abi,
                functionName: 'registerKeystore',
                args: [fromHex(keystoreKey, "bigint")]
            }),
            signer: owner,
            clients
        })

        // Execute a transaction through safeKeySpaceModule
        const amount = 10n
        await execSafeKeySpaceTransaction({
            module,
            safe,
            to: testToken.address,
            data: encodeFunctionData({
                abi: testToken.abi,
                functionName: 'transfer',
                args: [RECIPIENT_ADDR, amount]
            }),
            signer: owner,
            clients
        })

        // Check recipient should have received 10 TT
        expect(await getERC20Balance(testToken, RECIPIENT_ADDR)).to.equal(amount)

        // Check the nonce has been incremented
        expect(await module.read.nonces([safe.address])).to.equal(1)
    })
})