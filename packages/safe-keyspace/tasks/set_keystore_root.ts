import { task } from "hardhat/config";
import { getContractInstance } from "../common/utils";
import { ABI } from "../common/artifacts"

task("set_keystore_root", "Set Keystore root")
    .addParam("keystore", "The Keystore address")
    .addParam("root", "The Keystore root hash")
    .setAction(async (taskArgs, hre) => {
        await hre.run("compile");

        const readClient = await hre.viem.getPublicClient();
        const [deployerClient] = await hre.viem.getWalletClients()

        const keystore = getContractInstance(ABI.MockedKeystoreABI, taskArgs.keystore, { readClient, writeClient: deployerClient })

        const prevroot = await keystore.read.root()
        await keystore.write.setRoot([taskArgs.root])
        const newroot = await keystore.read.root()

        console.log(`========================== KEYSTORE ===========================`)
        console.log("Keystore address: " + taskArgs.keystore,);
        console.log("Keystore root (previous): " + prevroot);
        console.log("Keystore root (new): " + newroot);
        console.log(`============================================================`)
    });