import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

import { getBytes, solidityPackedKeccak256 } from 'ethers'

import { SafeKeystoreModule } from '../../typechain-types'

export default async function execKeystoreTransaction(
  module: SafeKeystoreModule,
  {
    safeL2,
    to,
    amount,
    signerL1
  }: any
) {

  // Build message
  const nonce = await module.nonces(safeL2)
  const msg = solidityPackedKeccak256(
    ["address", "uint256", "bytes", "uint8", "uint16"],
    [to, amount, "0x", "0", nonce]
  )

  // Sign message with signerL1
  const signature = await signerL1.signMessage(getBytes(msg))
  console.log(`---> signature of ${msg} by ${signerL1.address} = ${signature}`)

  // Execute transaction
  console.log(`---> executeTransaction :: to=${to}, amount=${amount}, data=${"0x"}, operation=${0}, signatures=${signature}`)
  return module.executeTransaction(
    safeL2,
    to, 
    amount, 
    "0x", 
    0,
    signature
  )
}