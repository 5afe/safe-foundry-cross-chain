import { Address, Hex } from 'viem'
import { ZERO_ADDRESS, ZERO_HASH, waitForTransaction } from './utils'
import { ISafe$Type } from '../artifacts/contracts/interfaces/ISafe.sol/ISafe'
import { Clients, ContractInstance, WriteClient } from './types'

export default async function execSafeTransaction(
  {
    safe,
    to,
    value = 0n,
    data = ZERO_HASH,
    signer,
    clients
  }: {
    safe: ContractInstance<ISafe$Type["abi"]>,
    to: Address,
    value?: bigint,
    data?: Hex,
    signer: WriteClient,
    clients: Clients
  }): Promise<void> {

  const chainId = await clients.readClient.getChainId()
  const nonce = await safe.read.nonce()

  const eip712Args = paramsToSign(safe.address, chainId, to, value, data, nonce)

  const signature = await signer.signTypedData(eip712Args)

  const hash = await safe.write.execTransaction(
    [to as Address,
      value,
      data,
      0, // operation
      0n,
      0n,
      0n,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      signature,]
  )
  await waitForTransaction(clients.readClient, hash)
}

function paramsToSign(address: Address, chainId: number, to: Address, value: bigint, data: Hex, nonce: bigint) {
  const domain = { verifyingContract: address, chainId }
  const primaryType = 'SafeTx' as const
  const types = {
    SafeTx: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'value' },
      { type: 'bytes', name: 'data' },
      { type: 'uint8', name: 'operation' },
      { type: 'uint256', name: 'safeTxGas' },
      { type: 'uint256', name: 'baseGas' },
      { type: 'uint256', name: 'gasPrice' },
      { type: 'address', name: 'gasToken' },
      { type: 'address', name: 'refundReceiver' },
      { type: 'uint256', name: 'nonce' },
    ],
  }
  const message = {
    to,
    value,
    data,
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce,
  }

  return { domain, primaryType, types, message }
}