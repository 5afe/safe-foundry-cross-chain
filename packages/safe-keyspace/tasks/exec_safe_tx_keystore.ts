
import { task } from "hardhat/config";
import { parseEther } from "viem";
import { getContractInstance, pkToWalletClient } from "../common/utils";
import execSafeKeySpaceTransaction from "../common/execSafeKeySpaceTransaction";
import { ABI } from "../common/artifacts"

task("exec_safe_keystore_tx", "Execute a Safe Keystore transaction")
    .addParam("safe", "The Safe address")
    .addParam("keystoremodule", "The SafeKeystore module address")
    .addParam("to", "Target address")
    .addParam("value", "Value", "0")
    .addParam("data", "Data", "0x")
    .addParam("ownerpk", "The owner private key")
    .setAction(async (taskArgs, hre) => {
        await hre.run("compile")

        const readClient = await hre.viem.getPublicClient()
        const [relayerClient] = await hre.viem.getWalletClients()

        const owner = pkToWalletClient(readClient, taskArgs.ownerpk)

        const safe = getContractInstance(ABI.ISafeABI, taskArgs.safe, { readClient, writeClient: relayerClient })
        const module = getContractInstance(ABI.SafeKeySpaceModuleABI, taskArgs.keystoremodule, { readClient, writeClient: relayerClient })

        await execSafeKeySpaceTransaction({
            module,
            safe,
            to: taskArgs.to,
            value: parseEther(taskArgs.value),
            data: taskArgs.data,
            signer: owner,
            clients: { readClient, writeClient: relayerClient }
        })
    });