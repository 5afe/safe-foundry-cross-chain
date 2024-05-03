import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import hre from 'hardhat'

import { SafeKeystoreModule__factory, ISafe__factory } from '../../typechain-types'

import deploySafeProxy from './deploySafeProxy'
import deploySingletons from './deploySingletons'
import execTransaction from './execSafeTransaction'
import { parseEther } from 'ethers'

export default async function setup() {
  const [owner1L1, owner2L1, ownerL2, deployer, relayer, recipient] = await hre.ethers.getSigners()
  const thresholdL1 = 2
  const thresholdL2 = 1

  const { safeProxyFactoryAddress, safeMastercopyAddress, safeKeystoreModuleAddress } = await deploySingletons(deployer)

  // Create two Safes
  const safeL1Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [owner1L1.address, owner2L1.address], thresholdL1, deployer)
  const safeL2Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [ownerL2.address], thresholdL2, deployer)
  // const token = await deployTestToken(deployer)

  // both the safe and the allowance work by signature
  // connect the contracts to a signer that has funds
  // but isn't safe owner, or allowance spender
  const safeL1 = ISafe__factory.connect(safeL1Address, relayer)
  const safeL2 = ISafe__factory.connect(safeL2Address, relayer)
  const safeKeystoreModule = SafeKeystoreModule__factory.connect(safeKeystoreModuleAddress, relayer)

  // fund the safe (1 ETH)
  await ownerL2.sendTransaction({
    to: safeL2Address,
    value: parseEther('1'),
  })

  // enable KeyStoreModule as module on SafeL2
  await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(safeKeystoreModuleAddress), ownerL2)

  // Register SafeL1 as Keystore for SafeL2
  await execTransaction(safeL2, await safeKeystoreModule.registerKeystore.populateTransaction(safeL1Address), ownerL2)

  return {
    //provider
    provider: owner1L1.provider,
    // safes
    safeL1,
    safeL2,
    // singletons
    safeKeystoreModule,
    // // test token
    // token,
    // signers
    owner1L1,
    owner2L1,
    ownerL2,
    // recipient
    recipient
  }
}