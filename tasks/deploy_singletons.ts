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
            safeSimulateTxAccessorAddress } = await deploySingletons(deployer)

        // L1Blocks & L1Sload
        const l1BlocksAddress = "0x5300000000000000000000000000000000000001"
        const l1SloadAddress = "0x0000000000000000000000000000000000000101"

        // Deploy SafeRemoteKeystoreModule
        const SafeRemoteKeystoreModuleFactory = await hre.ethers.getContractFactory('SafeRemoteKeystoreModule');
        const safeRemoteKeystoreModule = await SafeRemoteKeystoreModuleFactory.deploy();
        const safeRemoteKeystoreModuleAddress = await safeRemoteKeystoreModule.getAddress()

        // Deploy SafeDisableLocalKeystoreGuard
        const SafeDisableLocalKeystoreGuardFactory = await hre.ethers.getContractFactory('SafeDisableLocalKeystoreGuard');
        const safeDisableLocalKeystoreGuard = await SafeDisableLocalKeystoreGuardFactory.deploy(safeRemoteKeystoreModuleAddress);
        const safeDisableLocalKeystoreGuardAddress = await safeDisableLocalKeystoreGuard.getAddress()

        // Configure SafeRemoteKeystoreModule
        await safeRemoteKeystoreModule.initialize(l1BlocksAddress, l1SloadAddress, safeDisableLocalKeystoreGuardAddress)

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
