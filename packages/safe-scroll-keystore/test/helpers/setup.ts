import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import hre, { ethers } from 'hardhat'

import {
  ISafe__factory,
  TestToken,
  TestToken__factory,
  MockedL1Sload__factory,
  MockedL1Sload,
  MockedL1Blocks,
  MockedL1Blocks__factory,
} from '../../typechain-types'

import deploySafeProxy from '../../utils/deploySafeProxy'
import deploySingletons from '../../utils/deploySingletons'
import { AbiCoder, getBytes, hexlify, keccak256, parseEther, toUtf8Bytes, zeroPadValue } from 'ethers'


const SAFE_L1 = "0x0000000000000000000000000000000000005aFE"
const SAFE_NESTED_L1 = "0x0000000000000000000000000000000000006bEF"
export default async function setup() {
  const [owner1L1, owner2L1, ownerL2, deployer, relayer] = await hre.ethers.getSigners()
  const thresholdL1 = "0x02" // 2
  const thresholdL2 = "0x01"

  const { safeProxyFactoryAddress, safeMastercopyAddress } = await deploySingletons(deployer)

  // Create Safe
  const safeL2Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [ownerL2.address], thresholdL2, deployer)

  // Deploy Test/Mocks contracts
  const l1Blocks = await deployMockedL1Blocks(deployer)
  const l1sload = await deployMockedL1Sload(deployer)
  const token = await deployTestToken(deployer)

  // Configure Mocks
  const abiencoder = AbiCoder.defaultAbiCoder()
  const SENTINEL_ADDR = "0x0000000000000000000000000000000000000001"
  await l1sload.set(SAFE_L1, zeroPadValue("0x04", 32), zeroPadValue(thresholdL2, 32));
  await l1sload.set(
    SAFE_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [SENTINEL_ADDR, zeroPadValue("0x02", 32)])),
    zeroPadValue(owner1L1.address, 32));
  await l1sload.set(
    SAFE_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [owner1L1.address, zeroPadValue("0x02", 32)])),
    zeroPadValue(owner2L1.address, 32));
  await l1sload.set(
    SAFE_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [owner2L1.address, zeroPadValue("0x02", 32)])),
    zeroPadValue(SENTINEL_ADDR, 32));

  // Deploy Keystore module
  const SafeRemoteKeystoreModuleContract = await ethers.getContractFactory("SafeRemoteKeystoreModule");
  const safeRemoteKeystoreModule = await SafeRemoteKeystoreModuleContract.deploy();

  // Deploy Keystore guard
  const SafeDisableLocalKeystoreGuardContract = await ethers.getContractFactory("SafeDisableLocalKeystoreGuard");
  const safeDisableLocalKeystoreGuard = await SafeDisableLocalKeystoreGuardContract.deploy(safeRemoteKeystoreModule);

  // Configure Keystore module
  await safeRemoteKeystoreModule.initialize(l1Blocks, l1sload, safeDisableLocalKeystoreGuard)

  // Connect Safe
  //const safeL1 = ISafe__factory.connect(safeL1Address, relayer)
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
    safeL1: SAFE_L1,
    safeL2,
    // singletons
    safeRemoteKeystoreModule,
    safeDisableLocalKeystoreGuard,
    l1sload,
    // ERC20 token
    token,
    // signers
    owner1L1,
    owner2L1,
    ownerL2
  }
}

/// We are going to set a nested multisig account structure on L1:
/// The multisig account `SAFE_L1` has 2 owners : `owner1L1`(which is a EOA) and `safeNestedL1`(which is another multisig account)
/// The multisig account `SafeNestedL1` has 2 owners: `owner1L1` and `owner2L1`(which are both EOAs)
/// Both of the 2 multisig accounts(`SAFE_L1` & `SafeNestedL1`) have a threshold of 2
export async function nestedSetup() {
  const [owner1L1, owner2L1, ownerL2, deployer, relayer] = await hre.ethers.getSigners()
  const thresholdL1 = "0x02" // 2
  const thresholdL2 = "0x01"

  const { safeProxyFactoryAddress, safeMastercopyAddress } = await deploySingletons(deployer)

  // Create Safe
  const safeL2Address = await deploySafeProxy(safeProxyFactoryAddress, safeMastercopyAddress, [ownerL2.address], thresholdL2, deployer)

  // Deploy Test/Mocks contracts
  const l1Blocks = await deployMockedL1Blocks(deployer)
  const l1sload = await deployMockedL1Sload(deployer)
  const token = await deployTestToken(deployer)

  // Configure Mocks
  const abiencoder = AbiCoder.defaultAbiCoder()
  const SENTINEL_ADDR = "0x0000000000000000000000000000000000000001"
  await l1sload.set(SAFE_L1, zeroPadValue("0x04", 32), zeroPadValue(thresholdL1, 32));
  await l1sload.set(
    SAFE_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [SENTINEL_ADDR, zeroPadValue("0x02", 32)])),
    zeroPadValue(owner1L1.address, 32));
  await l1sload.set(
    SAFE_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [owner1L1.address, zeroPadValue("0x02", 32)])),
    zeroPadValue(SAFE_NESTED_L1, 32));
  await l1sload.set(
    SAFE_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [SAFE_NESTED_L1, zeroPadValue("0x02", 32)])),
    zeroPadValue(SENTINEL_ADDR, 32));
  // set the nested L1
  await l1sload.set(SAFE_NESTED_L1, zeroPadValue("0x04", 32), zeroPadValue(thresholdL1, 32));
  await l1sload.set(
    SAFE_NESTED_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [SENTINEL_ADDR, zeroPadValue("0x02", 32)])),
    zeroPadValue(owner1L1.address, 32));
  await l1sload.set(
    SAFE_NESTED_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [owner1L1.address, zeroPadValue("0x02", 32)])),
    zeroPadValue(owner2L1.address, 32));
  await l1sload.set(
    SAFE_NESTED_L1,
    keccak256(abiencoder.encode(["address", "uint256"], [owner2L1.address, zeroPadValue("0x02", 32)])),
    zeroPadValue(SENTINEL_ADDR, 32));
  

  // Deploy Keystore module
  const SafeRemoteKeystoreModuleContract = await ethers.getContractFactory("SafeRemoteKeystoreModule");
  const safeRemoteKeystoreModule = await SafeRemoteKeystoreModuleContract.deploy();

  // Deploy Keystore guard
  const SafeDisableLocalKeystoreGuardContract = await ethers.getContractFactory("SafeDisableLocalKeystoreGuard");
  const safeDisableLocalKeystoreGuard = await SafeDisableLocalKeystoreGuardContract.deploy(safeRemoteKeystoreModule);

  // Configure Keystore module
  await safeRemoteKeystoreModule.initialize(l1Blocks, l1sload, safeDisableLocalKeystoreGuard)

  // Connect Safe
  //const safeL1 = ISafe__factory.connect(safeL1Address, relayer)
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
    safeL1: SAFE_L1,
    safeNestedL1: SAFE_NESTED_L1,
    safeL2,
    // singletons
    safeRemoteKeystoreModule,
    safeDisableLocalKeystoreGuard,
    l1sload,
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