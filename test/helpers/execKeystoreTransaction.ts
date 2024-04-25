import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { ZeroAddress } from 'ethers'

import { SafeKeystoreModule } from '../../typechain-types'

export default async function execKeystoreTransaction(
  module: SafeKeystoreModule,
  {
    safeL2,
    to,
    amount,
    safeL1,
    signerL1
  }: any
) {

    // Build message


    // Sign message with signerL1


    // module.executeTransaction 


    return {}
}