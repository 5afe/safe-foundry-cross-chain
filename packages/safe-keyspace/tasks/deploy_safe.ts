
import { task } from "hardhat/config";
import { encodeFunctionData, fromHex } from "viem";
import { encodeMultiSend, extractPublicKeyFromWalletClient, pkToWalletClient } from "../common/utils";
import { getKeyspaceKey } from "../common/keybase";
import { ABI, ArtifactMultiSend } from "../common/artifacts"
import { deploySafeProxy } from "../common/deploySafeProxy";

task("deploy_safe", "Deploys a Safe proxy (single owner)")
  .addParam("factory", "The factory address")
  .addParam("mastercopy", "The masterCopy address")
  .addParam("multisend", "The Multisend address")
  .addParam("keystoremodule", "The SafeKeystore module address")
  .addParam("keystoremodulesetup", "The SafeKeystore Module setup address")
  .addParam("ownerpk", "The owner private key")
  .addParam("salt")
  .setAction(async (taskArgs, hre) => {
    await hre.run("compile");

    const readClient = await hre.viem.getPublicClient();
    const [relayerClient] = await hre.viem.getWalletClients()

    const owner = pkToWalletClient(readClient, taskArgs.ownerpk)
    const publicKey = await extractPublicKeyFromWalletClient(owner)
    const keystoreKey = getKeyspaceKey(publicKey)

    const safe = await deploySafeProxy({
      owners: [owner.account.address],
      threshold: 1,
      factory: taskArgs.factory,
      mastercopy: taskArgs.mastercopy,
      options: {
        salt: taskArgs.salt,
        callback: {
          to: taskArgs.multisend,
          data: encodeFunctionData({
            abi: ArtifactMultiSend.abi,
            functionName: 'multiSend',
            args: [encodeMultiSend([
              {
                to: taskArgs.keystoremodulesetup,
                data: encodeFunctionData({
                  abi: ABI.SafeKeySpaceModuleSetupABI,
                  functionName: 'enableModule',
                  args: [taskArgs.keystoremodule]
                }),
              },
              {
                to: taskArgs.keystoremodulesetup,
                data: encodeFunctionData({
                  abi: ABI.SafeKeySpaceModuleSetupABI,
                  functionName: 'configureModule',
                  args: [taskArgs.keystoremodule, fromHex(keystoreKey, "bigint")],
                }),
              }
            ])]
          }),
        }
      },
      clients: { readClient, writeClient: relayerClient }
    })

    await hre.run("get_safe", { safe: safe.address });
  });