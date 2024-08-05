import { task } from "hardhat/config";
import { parseEther } from "viem";

task("sent_eth", "Send some ETH")
    .addParam("to", "The receiver address")
    .addOptionalParam("amount", "The receiver address", "0.1")
    .setAction(async (taskArgs, hre) => {
        const [relayerClient] = await hre.viem.getWalletClients()
        const hash = await relayerClient.sendTransaction({
            to: taskArgs.to,
            value: parseEther(taskArgs.amount),
        })
        console.log(`========================== SEND ETH ===========================`)
        console.log(`=== To: ${taskArgs.to}`)
        console.log(`=== Value: ${parseEther(taskArgs.amount)} ETH`)
        console.log(`=== Hash: ${hash}`)
        console.log(`============================================================`)
    });