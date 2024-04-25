import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import hre from 'hardhat'

import { SafeKeystoreModule__factory, ISafe__factory } from '../../typechain-types'

import deploySafeProxy from './deploySafeProxy'
import deploySingletons from './deploySingletons'
import execTransaction from './execSafeTransaction'

export default async function setup() {
  const [ownerL1, ownerL2, deployer, relayer, recipient] = await hre.ethers.getSigners()
  const threshold = 1

  const { safeProxyFactoryAddress, safeMastercopyAddress, safeKeystoreModuleAddress } = await deploySingletons(deployer)

  // Create two Safes
  const safeL1Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [ownerL1.address], threshold, deployer)
  const safeL2Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [ownerL2.address], threshold, deployer)
  // const token = await deployTestToken(deployer)

  // both the safe and the allowance work by signature
  // connect the contracts to a signer that has funds
  // but isn't safe owner, or allowance spender
  const safeL1 = ISafe__factory.connect(safeL1Address, relayer)
  const safeL2 = ISafe__factory.connect(safeL2Address, relayer)
  const safeKeystoreModule = SafeKeystoreModule__factory.connect(safeKeystoreModuleAddress, relayer)

  // // fund the safe
  // await token.transfer(safeAddress, 1000)

  // enable KeyStoreModule as module on SafeL2
  await execTransaction(safeL2, await safeL2.enableModule.populateTransaction(safeKeystoreModuleAddress), ownerL2)

  return {
    //provider
    provider: ownerL1.provider,
    // safes
    safeL1,
    safeL2,
    // singletons
    safeKeystoreModule,
    // // test token
    // token,
    // signers
    ownerL1,
    ownerL2,
    // recipient
    recipient
  }
}