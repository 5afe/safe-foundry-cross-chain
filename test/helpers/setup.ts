import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import hre from 'hardhat'

import { SafeKeystoreModule__factory, ISafe__factory, TestToken, TestToken__factory } from '../../typechain-types'

import deploySafeProxy from './deploySafeProxy'
import deploySingletons from './deploySingletons'
import { parseEther } from 'ethers'

export default async function setup() {
  const [owner1L1, owner2L1, ownerL2, deployer, relayer] = await hre.ethers.getSigners()
  const thresholdL1 = 2
  const thresholdL2 = 1

  const { safeProxyFactoryAddress, safeMastercopyAddress, safeKeystoreModuleAddress } = await deploySingletons(deployer)

  // Create two Safes
  const safeL1Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [owner1L1.address, owner2L1.address], thresholdL1, deployer)
  const safeL2Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [ownerL2.address], thresholdL2, deployer)
 
  // Deploy TestToken TT
  const token = await deployTestToken(deployer)

  const safeL1 = ISafe__factory.connect(safeL1Address, relayer)
  const safeL2 = ISafe__factory.connect(safeL2Address, relayer)
  const safeKeystoreModule = SafeKeystoreModule__factory.connect(safeKeystoreModuleAddress, relayer)

  // fund the safe (1 ETH)
  await ownerL2.sendTransaction({
    to: safeL2Address,
    value: parseEther('1'),
  })

  // fund the safe (1000 TT)
  await token.transfer(safeL2Address, 1000)

  return {
    //provider
    provider: owner1L1.provider,
    // safes
    safeL1,
    safeL2,
    // singletons
    safeKeystoreModule,
    // ERC20 token
    token,
    // signers
    owner1L1,
    owner2L1,
    ownerL2
  }
}

async function deployTestToken(minter: SignerWithAddress): Promise<TestToken> {
  const factory: TestToken__factory = await hre.ethers.getContractFactory('TestToken', minter)
  return await factory.connect(minter).deploy()
}