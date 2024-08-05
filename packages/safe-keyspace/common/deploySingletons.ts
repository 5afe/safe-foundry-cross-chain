import { getSingletonFactoryInfo, SingletonFactoryInfo } from '@safe-global/safe-singleton-factory'
import {
  ArtifactSafe,
  ArtifactSafeProxyFactory,
  ArtifactMultiSend,
  ArtifactMultiSendCallOnly,
  ArtifactFallbackHandler,
  ArtifactSignMessageLib,
  ArtifactCreateCall,
  ArtifactSimulateTxAccessor,
} from './artifacts'
import { Abi, Address, encodeDeployData, getAddress, getCreate2Address, Hex, parseEther } from 'viem'
import { getContractInstance, isContract, waitForTransaction, ZERO_HASH } from './utils'
import { Artifact } from 'hardhat/types/artifacts'
import { Clients, ContractInstance } from './types'

export default async function deploySingletons(clients: Clients) {
  const factoryAddress = await deploySingletonFactory(clients)
  const safeMastercopy = await deploySingleton(clients, factoryAddress, ArtifactSafe)
  const safeProxyFactory = await deploySingleton(clients, factoryAddress, ArtifactSafeProxyFactory)
  const safeMultiSend = await deploySingleton(clients, factoryAddress, ArtifactMultiSend)
  const safeMultiSendCallOnly = await deploySingleton(clients, factoryAddress, ArtifactMultiSendCallOnly)
  const safeFallbackHandler = await deploySingleton(clients, factoryAddress, ArtifactFallbackHandler)
  const safeSignMessageLib = await deploySingleton(clients, factoryAddress, ArtifactSignMessageLib)
  const safeCreateCall = await deploySingleton(clients, factoryAddress, ArtifactCreateCall)
  const safeSimulateTxAccessor = await deploySingleton(clients, factoryAddress, ArtifactSimulateTxAccessor)

  return {
    factoryAddress,
    singletons: {
      safeMastercopy,
      safeProxyFactory,
      safeMultiSend,
      safeMultiSendCallOnly,
      safeFallbackHandler,
      safeSignMessageLib,
      safeCreateCall,
      safeSimulateTxAccessor
    }

  }
}

export const deploySingletonFactory = async (clients: Clients): Promise<Address> => {
  const chainId = await clients.readClient.getChainId()

  const { address, signerAddress, transaction } = getSingletonFactoryInfo(chainId) as SingletonFactoryInfo
  const addressFormated = getAddress(address)

  if (await isContract(clients.readClient, addressFormated)) {
    // Singleton factory already deployed...
    return addressFormated
  }

  // fund the presined transaction signer
  let hash = await clients.writeClient.sendTransaction({
    to: getAddress(signerAddress),
    value: parseEther('0.1')
  })
  await waitForTransaction(clients.readClient, hash)

  // shoot the presigned transaction
  hash = await clients.writeClient.sendRawTransaction({ serializedTransaction: transaction as Hex })
  await waitForTransaction(clients.readClient, hash)

  return addressFormated
}

export const deploySingleton = async <TABI extends Abi>(
  clients: Clients,
  factory: Address,
  artfifact: Artifact,
  args: any[] = [])
  : Promise<ContractInstance<TABI>> => {
  const salt = ZERO_HASH
  const bytecode = encodeDeployData({
    abi: artfifact.abi,
    bytecode: artfifact.bytecode as Hex,
    args
  })

  const create2Addr = getCreate2Address({
    bytecode, from: factory, salt
  })

  if (await isContract(clients.readClient, create2Addr)) {
    // Singleton already deployed...
    return getContractInstance(artfifact.abi as unknown as TABI, create2Addr, clients)
  }

  const hash = await clients.writeClient.sendTransaction({
    to: factory,
    data: `${salt}${bytecode.slice(2)}`
  })
  await waitForTransaction(clients.readClient, hash)

  return getContractInstance(artfifact.abi as unknown as TABI, create2Addr, clients)
}
