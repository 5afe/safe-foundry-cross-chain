import { concat, getBytes, solidityPackedKeccak256 } from 'ethers'
import { SafeRemoteKeystoreModule } from '../../typechain-types'

export default async function execKeystoreTransaction(
  module: SafeRemoteKeystoreModule,
  {
    safeL2,
    to,
    value,
    data,
    operation,
    signersL1
  }: any
) {
  // Get message
  const msg = await module.getTxHash(safeL2, to, value, data, operation)

  // Sign message with signerL1
  const signatures = []
  for (var signer of signersL1) {
    const signature = await signer.signMessage(getBytes(msg))
    signatures.push(signature)
  }

  // Execute transaction
  console.log(`---> SafeKeystoreModule.executeTransaction :: to=${to}, value=${value}, data=${data}, operation=${operation}, signatures=${concat(signatures)}`)
  return module.executeTransaction(
    safeL2,
    to,
    value,
    data,
    operation,
    concat(signatures)
  )
}