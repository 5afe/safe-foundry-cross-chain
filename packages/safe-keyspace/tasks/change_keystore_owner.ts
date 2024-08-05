
import { task } from "hardhat/config";
import { encodeSignature, extractPublicKeyFromWalletClient, getContractInstanceReadOnly, pkToWalletClient } from "../common/utils";
import { getKeyspaceKey, getRecoverProof, setConfig } from "../common/keybase";
import { sign } from "viem/accounts";
import { fromHex, toHex } from "viem";
import { ABI } from "../common/artifacts"

task("change_keystore_owner", "Change Keystore owner")
  .addParam("safe", "The Safe address")
  .addParam("keystoremodule", "The SafeKeystore module address")
  .addParam("currentownerpk", "The current owner private key")
  .addParam("newownerpk", "The new owner private key")
  .setAction(async (taskArgs, hre) => {
    await hre.run("compile")

    const readClient = await hre.viem.getPublicClient()

    const module = getContractInstanceReadOnly(ABI.SafeKeySpaceModuleABI, taskArgs.keystoremodule, readClient)

    const keyspaceKey = toHex(await module.read.keyspaceKeys([taskArgs.safe]))

    const newOwnerWallet = pkToWalletClient(readClient, taskArgs.newownerpk)
    const newOwnerPublicKey = await extractPublicKeyFromWalletClient(newOwnerWallet)
    const newKey = getKeyspaceKey(newOwnerPublicKey)
    const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 });

    const signature = await sign({ hash: newKey254, privateKey: taskArgs.currentownerpk });

    const proof = await getRecoverProof(keyspaceKey, newKey, encodeSignature(signature))
    console.log(`===> proof: ${JSON.stringify(proof)}`)

    await setConfig(keyspaceKey, newKey, proof)

    console.log(`DONE`)

  });