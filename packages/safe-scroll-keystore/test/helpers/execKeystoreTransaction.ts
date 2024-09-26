import { concat, getBytes, solidityPackedKeccak256 } from 'ethers'
import { SafeRemoteKeystoreModule } from '../../typechain-types'
import { sign } from 'crypto';
const CONTRACT_ADDR_PREFIX = "0x000000000000000000000000";
const CONTRACT_SIG_V = "0x00";
const CONTRACT_SIG_OFFSET = "0x0000000000000000000000000000000000000000000000000000000000000082";

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

  // Sign message with signers L1
  const signatures: string[] = []
  for (var signer of signersL1) {
    let signature = await signer.signMessage(getBytes(msg));
    signatures.push(updateEIP191Sig(signature)) 

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

export async function execKeystoreTransactionNested(
  module: SafeRemoteKeystoreModule,
  {
    safeL2,
    safeL1,
    to,
    value,
    data,
    operation,
    signersL1
  }: any
) {
  // Get message
  const msg = await module.getTxHash(safeL2, to, value, data, operation)

  // Sign message with signers L1
  const signatures: string[] = []
  const signature_owner1 = await signersL1[0].signMessage(getBytes(msg));

  // First we need the signersL1[0] -- owner1L1, to sign the tx, the owner1L1 is the EOA member of SAFE_L1
  signatures.push(updateEIP191Sig(signature_owner1));

  // Then, we will construct the contract sig for safeNestedL1
  signatures.push(CONTRACT_ADDR_PREFIX, safeL1);
  signatures.push(CONTRACT_SIG_OFFSET, CONTRACT_SIG_V);
  
  // Set the offset for the following 2 signature
  signatures.push(CONTRACT_SIG_OFFSET);

  // concat with the sig by owner1L1 & owner2L1
  for (var signer of signersL1) {
    let signature = await signer.signMessage(getBytes(msg));
    signatures.push(updateEIP191Sig(signature))   
  }

  console.log(signatures)
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

function updateEIP191Sig(
  signature: string
) {
  const lastByte = signature.slice(-2);
  // Since it is a eip191 sig
  if (lastByte === "1b" || lastByte === "1c") {
    const modifiedByte = (parseInt(lastByte, 16) + 4).toString(16);
    signature = signature.slice(0, -2) + modifiedByte.padStart(2, "0");
    return signature
  } else {
    throw new Error("Last byte is not 1b or 1c");
  }
}
