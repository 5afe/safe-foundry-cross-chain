
import { VK_HASH, getDataHash, getProof } from '../test/helpers/keybase'
import { Address, Hex, fromHex, toHex } from 'viem'
import { extractPublicKeyFromWalletClient, waitForTransaction } from './utils'
import { SafeKeySpaceModule$Type } from '../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule'
import { ISafe$Type } from '../artifacts/contracts/interfaces/ISafe.sol/ISafe'
import { Clients, ContractInstance, WriteClient } from './types'

export default async function execSafeKeySpaceTransaction(
  {
    module,
    safe,
    to,
    value = 0n,
    data = "0x",
    operation = 0,
    signer,
    clients
  }: {
    module: ContractInstance<SafeKeySpaceModule$Type["abi"]>,
    safe: ContractInstance<ISafe$Type["abi"]>,
    to: Address,
    value?: bigint,
    data?: Hex,
    operation?: number,
    signer: WriteClient
    clients: Clients
  }
): Promise<void> {
  // Get message
  const message = await module.read.getTxHash([safe.address, to, value, data, operation])

  // Sign message with signer
  const signature = await signer.signMessage({ message: { raw: message } })

  // Generate State proof
  const publicKey = await extractPublicKeyFromWalletClient(signer)
  const keyspaceKey = await module.read.keyspaceKeys([safe.address])
  const dataHash = getDataHash(publicKey)
  const stateProof = await getProof(toHex(keyspaceKey), VK_HASH, dataHash);

  // Execute transaction
  console.log(`---> SafeKeySpaceModule.executeTransaction :: to: ${to}, value: ${value}, data: ${data}, operation: ${operation}, ` +
    `signature: ${signature}, publicKey: ${JSON.stringify(publicKey)}, stateProof: ${stateProof.proof}}`)
  console.log(`---> SafeKeySpaceModule :: keyspaceKey: ${toHex(keyspaceKey)}`)

  const hash = await module.write.executeTransaction([
    safe.address,
    to,
    value,
    data,
    operation,
    signature,
    fromHex(publicKey.x, "bigint"),
    fromHex(publicKey.y, "bigint"),
    stateProof.proof],
    { gas: 10000000n }
  )
  await waitForTransaction(clients.readClient, hash)
}