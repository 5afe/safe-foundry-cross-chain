import { Address, Hex, concat, encodeDeployData, encodeFunctionData, getCreate2Address, keccak256 } from 'viem'
import { ABI, ArtifactSafe, ArtifactSafeProxy, ArtifactSafeProxyFactory } from './artifacts'
import { ZERO_ADDRESS, ZERO_HASH, getContractInstance, getRandomBytes, isContract, waitForTransaction } from './utils'
import { Clients, ContractInstance } from './types'
import { ISafe$Type } from '../artifacts/contracts/interfaces/ISafe.sol/ISafe'

export function calculateSafeProxyAddress(
  {
    owners,
    threshold,
    factory,
    mastercopy,
    options,
    clients
  }: {
    owners: Address[],
    threshold: number,
    factory: Address,
    mastercopy: Address,
    options?: { salt?: Hex, callback?: { to: Address, data: Hex }, fallbackHandler?: Address }
    clients: Clients,
  }
): Address {
  const salt = options?.salt || getRandomBytes()

  const initializer = calculateInitializer(owners, threshold, options?.callback, options?.fallbackHandler)

  const address = calculateProxyAddress(initializer, factory, mastercopy, salt)

  return address
}

export async function deploySafeProxy(
  {
    owners,
    threshold,
    factory,
    mastercopy,
    options,
    clients
  }: {
    owners: Address[],
    threshold: number,
    factory: Address,
    mastercopy: Address,
    options?: { salt?: Hex, callback?: { to: Address, data: Hex }, fallbackHandler?: Address }
    clients: Clients,
  }
): Promise<ContractInstance<ISafe$Type["abi"]>> {
  const salt = options?.salt || getRandomBytes()

  const initializer = calculateInitializer(owners, threshold, options?.callback, options?.fallbackHandler)

  const address = calculateProxyAddress(initializer, factory, mastercopy, salt)

  if (await isContract(clients.readClient, address)) {
    console.warn(`Safe ${address} has already been deployed`)
    return getContractInstance(
      ABI.ISafeABI,
      address,
      clients)
  }

  const hash = await clients.writeClient.sendTransaction({
    to: factory,
    data: encodeFunctionData({
      abi: ArtifactSafeProxyFactory.abi,
      functionName: 'createProxyWithNonce',
      args: [mastercopy, initializer, salt]
    })
  })
  await waitForTransaction(clients.readClient, hash)

  return getContractInstance(
    ABI.ISafeABI,
    address,
    clients)
}

const calculateInitializer = (owners: Address[], threshold: number, callback?: { to: Address, data: Hex }, fallbackHandler?: Address): Hex => {
  const initializer = encodeFunctionData({
    abi: ArtifactSafe.abi,
    functionName: 'setup',
    args: [
      owners,
      threshold,
      callback ? callback.to : ZERO_ADDRESS, // to - for setupModules
      callback ? callback.data : ZERO_HASH, // data - for setupModules
      fallbackHandler || ZERO_ADDRESS, // fallbackHandler
      ZERO_ADDRESS, // paymentToken
      0, // payment
      ZERO_ADDRESS, // paymentReceiver
    ]
  })

  return initializer
}

const calculateProxyAddress = (initializer: Hex, factory: Address, mastercopy: Address, salt: Hex): Address => {
  const bytecode = encodeDeployData({
    abi: ArtifactSafeProxy.abi,
    bytecode: ArtifactSafeProxy.bytecode as Hex,
    args: [mastercopy]
  })

  return getCreate2Address({
    bytecode,
    from: factory,
    salt: keccak256(concat([keccak256(initializer), salt]))
  })
}