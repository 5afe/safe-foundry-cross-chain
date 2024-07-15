import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import {
  getSingletonFactoryInfo,
  SingletonFactoryInfo,
} from '@safe-global/safe-singleton-factory';
import {
  AddressLike,
  getCreate2Address,
  keccak256,
  parseUnits,
  ZeroHash,
} from 'ethers';

import {
  ArtifactSafe,
  ArtifactSafeProxyFactory,
  ArtifactMultiSend,
  ArtifactMultiSendCallOnly,
  ArtifactFallbackHandler,
  ArtifactSignMessageLib,
  ArtifactCreateCall,
  ArtifactSimulateTxAccessor,
} from './artifacts';

export default async function deploySingletons(deployer: SignerWithAddress) {
  const factoryAddress = await deploySingletonFactory(deployer);
  const safeMastercopyAddress = await deploySingleton(
    factoryAddress,
    ArtifactSafe.bytecode,
    deployer
  );
  const safeProxyFactoryAddress = await deploySingleton(
    factoryAddress,
    ArtifactSafeProxyFactory.bytecode,
    deployer
  );
  const safeMultiSendAddress = await deploySingleton(
    factoryAddress,
    ArtifactMultiSend.bytecode,
    deployer
  );
  const safeMultiSendCallOnlyAddress = await deploySingleton(
    factoryAddress,
    ArtifactMultiSendCallOnly.bytecode,
    deployer
  );
  const safeFallbackHandlerAddress = await deploySingleton(
    factoryAddress,
    ArtifactFallbackHandler.bytecode,
    deployer
  );
  const safeSignMessageLibAddress = await deploySingleton(
    factoryAddress,
    ArtifactSignMessageLib.bytecode,
    deployer
  );
  const safeCreateCallAddress = await deploySingleton(
    factoryAddress,
    ArtifactCreateCall.bytecode,
    deployer
  );
  const safeSimulateTxAccessorAddress = await deploySingleton(
    factoryAddress,
    ArtifactSimulateTxAccessor.bytecode,
    deployer
  );

  return {
    safeMastercopyAddress,
    safeProxyFactoryAddress,
    safeMultiSendAddress,
    safeMultiSendCallOnlyAddress,
    safeFallbackHandlerAddress,
    safeSignMessageLibAddress,
    safeCreateCallAddress,
    safeSimulateTxAccessorAddress,
  };
}

async function isContract(signer: SignerWithAddress, address: AddressLike) {
  const code = await signer.provider.getCode(address);
  return code !== '0x';
}

async function deploySingletonFactory(signer: SignerWithAddress) {
  const { chainId } = await signer.provider.getNetwork();

  // Scroll devnet
  if (Number(chainId) === 2227728) {
    return '0x6e2674589516E20A412aBC2f611a17Beacd3Ce90';
  }

  const { address, signerAddress, transaction } = getSingletonFactoryInfo(
    Number(chainId)
  ) as SingletonFactoryInfo;

  if (await isContract(signer, address)) {
    // Proxy factory already deployed...
    return address;
  }

  // fund the presined transaction signer
  await signer.sendTransaction({
    to: signerAddress,
    value: parseUnits('0.1', 18),
  });

  // shoot the presigned transaction
  await signer.provider.broadcastTransaction(transaction);

  return address;
}

async function deploySingleton(
  factory: string,
  bytecode: string,
  signer: SignerWithAddress
) {
  const salt = ZeroHash;
  const create2Addr = getCreate2Address(factory, salt, keccak256(bytecode));

  if (await isContract(signer, create2Addr)) {
    // Singleton already deployed...
    return create2Addr;
  }

  await signer.sendTransaction({
    to: factory,
    data: `${salt}${bytecode.slice(2)}`,
    value: 0,
  });

  return getCreate2Address(factory, salt, keccak256(bytecode));
}
