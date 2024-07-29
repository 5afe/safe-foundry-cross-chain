
import { task } from "hardhat/config";
import deploySafeProxy from "../common/deploySafeProxy";
import { encodeFunctionData, fromHex } from "viem";
import execSafeTransaction from "../common/execSafeTransaction";
import { extractPublicKeyFromWalletClient, getContractInstance, pkToWalletClient } from "../common/utils";
import { getKeyspaceKey } from "../test/helpers/keybase";
import { ABI } from "../common/artifacts"

task("deploy_safe", "Deploys a Safe proxy (single owner)")
    .addParam("factory", "The factory address")
    .addParam("mastercopy", "The masterCopy address")
    .addParam("keystoremodule", "The SafeKeystore module address")
    .addParam("ownerpk", "The owner private key")
    .addParam("salt")
    .setAction(async (taskArgs, hre) => {
        await hre.run("compile");

        const readClient = await hre.viem.getPublicClient();
        const [relayerClient] = await hre.viem.getWalletClients()

        const owner = pkToWalletClient(readClient, taskArgs.ownerpk)

        const safe = await deploySafeProxy({
            owners: [owner.account.address],
            threshold: 1,
            factory: taskArgs.factory,
            mastercopy: taskArgs.mastercopy,
            options: {
                salt: taskArgs.salt
            },
            clients: { readClient, writeClient: relayerClient }
        })
        const module = getContractInstance(ABI.SafeKeySpaceModuleABI, taskArgs.keystoremodule, { readClient, writeClient: relayerClient })

        // Enable KeyStoreModule as module on Safe
        await execSafeTransaction({
            safe,
            to: safe.address,
            data: encodeFunctionData({
                abi: safe.abi,
                functionName: 'enableModule',
                args: [module.address]
            }),
            signer: owner,
            clients: { readClient, writeClient: relayerClient }
        })

        // Register keystore on the Safe
        const publicKey = await extractPublicKeyFromWalletClient(owner)
        const keystoreKey = getKeyspaceKey(publicKey)

        await execSafeTransaction({
            safe,
            to: module.address,
            data: encodeFunctionData({
                abi: module.abi,
                functionName: 'registerKeystore',
                args: [fromHex(keystoreKey, "bigint")]
            }),
            signer: owner,
            clients: { readClient, writeClient: relayerClient }
        })

        await hre.run("get_safe", { safe: safe.address });
    });