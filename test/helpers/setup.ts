import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import hre, { ethers } from 'hardhat'

import { 
  SafeRemoteKeystoreModule__factory, 
  ISafe__factory, 
  TestToken, 
  TestToken__factory, 
  MockedL1Sload__factory,
  MockedL1Sload,
  MockedL1Blocks,
  MockedL1Blocks__factory,} from '../../typechain-types'

import deploySafeProxy from '../../utils/deploySafeProxy'
import deploySingletons from '../../utils/deploySingletons'
import { parseEther } from 'ethers'

export default async function setup() {
  const [owner1L1, owner2L1, ownerL2, deployer, relayer] = await hre.ethers.getSigners()
  const thresholdL1 = 2
  const thresholdL2 = 1

  const { safeProxyFactoryAddress, safeMastercopyAddress } = await deploySingletons(deployer)

  // Create two Safes
  const safeL1Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [owner1L1.address, owner2L1.address], thresholdL1, deployer)
  const safeL2Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [ownerL2.address], thresholdL2, deployer)

  // Deploy Test contracts
  const l1Blocks = await deployMockedL1Blocks(deployer)
  const l1sload = await deployMockedL1Sload(deployer)
  const token = await deployTestToken(deployer)

  // Deploy Keystore module
  const SafeRemoteKeystoreModuleContract = await ethers.getContractFactory("SafeRemoteKeystoreModule");
  const safeRemoteKeystoreModule = await SafeRemoteKeystoreModuleContract.deploy(l1Blocks, l1sload);

  // Deploy Keystore guard
  const SafeDisableLocalKeystoreGuardContract = await ethers.getContractFactory("SafeDisableLocalKeystoreGuard");
  const safeDisableLocalKeystoreGuard = await SafeDisableLocalKeystoreGuardContract.deploy(safeRemoteKeystoreModule);

  // Connect Safe
  const safeL1 = ISafe__factory.connect(safeL1Address, relayer)
  const safeL2 = ISafe__factory.connect(safeL2Address, relayer)

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
    safeRemoteKeystoreModule,
    safeDisableLocalKeystoreGuard,
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

async function deployMockedL1Blocks(minter: SignerWithAddress): Promise<MockedL1Blocks> {
  const factory: MockedL1Blocks__factory = await hre.ethers.getContractFactory('MockedL1Blocks', minter)
  return await factory.connect(minter).deploy()
}

async function deployMockedL1Sload(minter: SignerWithAddress): Promise<MockedL1Sload> {
  const factory: MockedL1Sload__factory = await hre.ethers.getContractFactory('MockedL1Sload', minter)
  return await factory.connect(minter).deploy()
}