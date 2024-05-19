import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { AbiCoder, BytesLike, concat, getCreate2Address, hexlify, Interface, keccak256, randomBytes, ZeroAddress, ZeroHash } from 'ethers'

import { ArtifactSafe, ArtifactSafeProxy, ArtifactSafeProxyFactory } from './artifacts'

export default async function deploySafeProxy(
  factory: string,
  mastercopy: string,
  owners: string[],
  threshold: number,
  deployer: SignerWithAddress,
  salt?: BytesLike
): Promise<string> {

  salt = salt || hexlify(randomBytes(32))

  const initializer = calculateInitializer(owners, threshold)

  const iface = new Interface(ArtifactSafeProxyFactory.abi)
  await deployer.sendTransaction({
    to: factory,
    data: iface.encodeFunctionData('createProxyWithNonce', [mastercopy, initializer, salt]),
  })

  return calculateProxyAddress(initializer, factory, mastercopy, salt)
}

function calculateInitializer(owners: string[], threshold: number): string {
  const iface = new Interface(ArtifactSafe.abi)

  const initializer = iface.encodeFunctionData('setup', [
    owners,
    threshold,
    ZeroAddress, // to - for setupModules
    '0x', // data - for setupModules
    ZeroAddress, // fallbackHandler
    ZeroAddress, // paymentToken
    0, // payment
    ZeroAddress, // paymentReceiver
  ])

  return initializer
}

function calculateProxyAddress(initializer: string, factory: string, mastercopy: string, salt: BytesLike): string {

  const deploymentData = concat([ArtifactSafeProxy.bytecode, AbiCoder.defaultAbiCoder().encode(['address'], [mastercopy])])

  return getCreate2Address(factory, keccak256(concat([keccak256(initializer), salt])), keccak256(deploymentData))
}