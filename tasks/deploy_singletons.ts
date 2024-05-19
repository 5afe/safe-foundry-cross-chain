import deploySingletons from "../utils/deploySingletons";
import { task } from "hardhat/config";

task("deploy_singletons", "Deploys Safe's singletons")
    .setAction(async (_taskArgs, hre) => {
        await hre.run("compile");

        const [deployer] = await hre.ethers.getSigners();

        console.log(`Deploying contract from ${deployer.address}`)

        // Deploy all singletons
        const {
            safeMastercopyAddress,
            safeProxyFactoryAddress,
            safeMultiSendAddress,
            safeMultiSendCallOnlyAddress,
            safeFallbackHandlerAddress,
            safeSignMessageLibAddress,
            safeCreateCallAddress,
            safeSimulateTxAccessorAddress} = await deploySingletons(deployer)

        // L1Blocks & L1Sload
        const L1BlocksFactory = await hre.ethers.getContractFactory('MockedL1Blocks');
        const l1Blocks = await L1BlocksFactory.deploy();
        const l1BlocksAddress = await l1Blocks.getAddress() //TODO CHANGE ME!!!
        
        const L1SloadFactory = await hre.ethers.getContractFactory('MockedL1Sload');
        const l1Sload = await L1SloadFactory.deploy();
        const l1SloadAddress = await l1Sload.getAddress() //TODO CHANGE ME!!!

        // Deploy SafeDisableLocalKeystoreGuard
        const SafeRemoteKeystoreModuleFactory = await hre.ethers.getContractFactory('SafeRemoteKeystoreModule');
        const safeRemoteKeystoreModule = await SafeRemoteKeystoreModuleFactory.deploy(l1BlocksAddress, l1SloadAddress);
        const safeRemoteKeystoreModuleAddress = await safeRemoteKeystoreModule.getAddress()

        // Deploy SafeDisableLocalKeystoreGuard
        const SafeDisableLocalKeystoreGuardFactory = await hre.ethers.getContractFactory('SafeDisableLocalKeystoreGuard');
        const safeDisableLocalKeystoreGuard = await SafeDisableLocalKeystoreGuardFactory.deploy(safeRemoteKeystoreModuleAddress);
        const safeDisableLocalKeystoreGuardAddress = await safeDisableLocalKeystoreGuard.getAddress()

        console.log("safeProxyFactoryAddress: " + safeProxyFactoryAddress);
        console.log("safeMastercopyAddress: " + safeMastercopyAddress);
        console.log("safeMultiSendAddress: " + safeMultiSendAddress);
        console.log("safeMultiSendCallOnlyAddress: " + safeMultiSendCallOnlyAddress);
        console.log("safeFallbackHandlerAddress: " + safeFallbackHandlerAddress);
        console.log("safeSignMessageLibAddress: " + safeSignMessageLibAddress);
        console.log("safeCreateCallAddress: " + safeCreateCallAddress);
        console.log("safeSimulateTxAccessorAddress: " + safeSimulateTxAccessorAddress);
        console.log("SafeRemoteKeystoreModule: " + safeRemoteKeystoreModuleAddress);
        console.log("SafeDisableLocalKeystoreGuard: " + safeDisableLocalKeystoreGuardAddress);
    });
