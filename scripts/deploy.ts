import { ethers } from "hardhat";


async function deploy() {

    // Deploy SafeRemoteKeystoreModule
    const SafeRemoteKeystoreModuleFactory = await ethers.getContractFactory('SafeRemoteKeystoreModule');
    const safeRemoteKeystoreModule = await SafeRemoteKeystoreModuleFactory.deploy();
    const safeRemoteKeystoreModuleAddress = await safeRemoteKeystoreModule.getAddress()

    // Deploy SafeDisableLocalKeystoreGuard
    const SafeDisableLocalKeystoreGuardFactory = await ethers.getContractFactory('SafeDisableLocalKeystoreGuard');
    const safeDisableLocalKeystoreGuard = await SafeDisableLocalKeystoreGuardFactory.deploy(safeRemoteKeystoreModuleAddress);
    const safeDisableLocalKeystoreGuardAddress = await safeDisableLocalKeystoreGuard.getAddress()

    console.log("SafeRemoteKeystoreModule: " + safeRemoteKeystoreModuleAddress);
    console.log("SafeDisableLocalKeystoreGuard: " + safeDisableLocalKeystoreGuardAddress);
}

deploy()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
    })