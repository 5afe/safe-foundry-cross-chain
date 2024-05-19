import { task } from "hardhat/config";
import { parseEther } from "ethers";

task("sent_eth", "Send some ETH")
    .addParam("to", "The receiver address")
    .setAction(async (taskArgs, hre) => {
        const [deployer] = await hre.ethers.getSigners()
        const tx = await deployer.sendTransaction({
            to: taskArgs.to,
            value: parseEther('1'),
          })
    });