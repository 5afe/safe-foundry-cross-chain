import { ethers } from "hardhat";
import { task } from "hardhat/config";
import deploySafeProxy from "../utils/deploySafeProxy";
import { getBytes, hexlify } from "ethers";

task("deploy_safe", "Deploys a Safe proxy")
    .addParam("factory", "The factory address")
    .addParam("mastercopy", "The masterCopy address")
    .addParam("owner", "The owner address")
    .setAction(async (taskArgs, hre) => {
        await hre.run("compile");
        const [deployer] = await hre.ethers.getSigners()
        const safeAddr = await deploySafeProxy(taskArgs.factory, taskArgs.mastercopy, [taskArgs.owner], 1, deployer)
        console.log("safeAddr: " + safeAddr);
    });