import { task } from "hardhat/config";
import { formatEther } from "viem";
import { getSafeInfo } from "../common/utils";

task("get_safe", "Get Safe details")
  .addParam("safe", "The Safe address")
  .setAction(async (taskArgs, hre) => {
    await hre.run("compile");

    const readClient = await hre.viem.getPublicClient();
    const safe = await getSafeInfo(readClient, taskArgs.safe)

    console.log(`========================== SAFE ===========================`)
    console.log(`=== Network: ${hre.network.name}`)
    console.log(`=== Safe Address: ${safe.address}`)
    console.log(`=== Safe Version: ${safe.version}`)
    console.log(`=== Safe Owners: ${safe.owners.join(", ")}`)
    console.log(`=== Safe Threshold: ${safe.threshold}`)
    console.log(`=== Safe Nonce: ${safe.nonce}`)
    console.log(`=== Safe Modules: ${safe.modules.join(", ")}`)
    console.log(`=== Safe Balance: ${formatEther(safe.balance)} ETH`)
    console.log(`============================================================`)
  });