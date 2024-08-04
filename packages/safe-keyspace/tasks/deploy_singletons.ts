import { Address, Hex, encodeDeployData } from "viem";
import deploySingletons, { deploySingleton } from "../common/deploySingletons";
import { task } from "hardhat/config";
import MockedKeystoreArtifact from "../artifacts/contracts/test/MockedKeystore.sol/MockedKeystore.json"
import StateVerifierArtifact from "../artifacts/contracts/libs/StateVerifier.sol/StateVerifier.json"
import SafeKeySpaceModuleArtifact from "../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule.json"
import SafeKeySpaceModuleSetupArtifact from "../artifacts/contracts/SafeKeySpaceModuleSetup.sol/SafeKeySpaceModuleSetup.json"
import SafeDisableExecTransactionGuardArtifact from "../artifacts/contracts/SafeDisableExecTransactionGuard.sol/SafeDisableExecTransactionGuard.json"
import { SafeKeySpaceModuleSetup$Type } from "../artifacts/contracts/SafeKeySpaceModuleSetup.sol/SafeKeySpaceModuleSetup";

const STATE_VERIFIER: { [_: string]: Address } = {
    base_sepolia: "0xfF8cc58Ef1B5a5548b474fDf5FAC0a6A8F748604", // https://sepolia.basescan.org/address/0xfF8cc58Ef1B5a5548b474fDf5FAC0a6A8F748604#readContract
    op_sepolia: "0xfF8cc58Ef1B5a5548b474fDf5FAC0a6A8F748604", // https://sepolia-optimism.etherscan.io/address/0xfF8cc58Ef1B5a5548b474fDf5FAC0a6A8F748604#readContract
    sepolia: "0xfF8cc58Ef1B5a5548b474fDf5FAC0a6A8F748604" // https://sepolia.etherscan.io/address/0xfF8cc58Ef1B5a5548b474fDf5FAC0a6A8F748604#readContract
}

const KEYSTORE: { [_: string]: Address } = {
    base_sepolia: "0x610A7e97C6D2F1E09e6390F013BFCc39B8EE49e2", // https://sepolia.basescan.org/address/0x610A7e97C6D2F1E09e6390F013BFCc39B8EE49e2#readContract
    op_sepolia: "0x610A7e97C6D2F1E09e6390F013BFCc39B8EE49e2", // https://sepolia-optimism.etherscan.io/address/0x610A7e97C6D2F1E09e6390F013BFCc39B8EE49e2#code
    sepolia: "0x45b924Ee3EE404E4a9E2a3AFD0AD357eFf79fC49" // https://sepolia.etherscan.io/address/0x45b924ee3ee404e4a9e2a3afd0ad357eff79fc49#readContract
}

task("deploy_singletons", "Deploys Safe's singletons")
    .addParam("root", "The Keystore root")
    .setAction(async (taskArgs, hre) => {
        await hre.run("compile")

        const network = hre.network.name

        const [deployerClient] = await hre.viem.getWalletClients()
        const readClient = await hre.viem.getPublicClient()

        // Deploy all singletons
        const {
            factoryAddress,
            singletons:
            { safeMastercopy,
                safeProxyFactory,
                safeMultiSend,
                safeMultiSendCallOnly,
                safeFallbackHandler,
                safeSignMessageLib,
                safeCreateCall,
                safeSimulateTxAccessor }
        } = await deploySingletons({ readClient, writeClient: deployerClient })

        let keystoreAddress
        let stateVerifierAddress
        if (["hardhat", "localhost"].includes(network)) {
            const keystore = await deploySingleton({ readClient, writeClient: deployerClient }, factoryAddress, MockedKeystoreArtifact)
            await keystore.write.setRoot([taskArgs.root])
            keystoreAddress = keystore.address
            const stateVerifier = await deploySingleton({ readClient, writeClient: deployerClient }, factoryAddress, StateVerifierArtifact)
            stateVerifierAddress = stateVerifier.address
        } else {
            keystoreAddress = KEYSTORE[network]
            stateVerifierAddress = STATE_VERIFIER[network]
        }

        // Deploy SafeKeystore module and guard
        const moduleSetup = await deploySingleton<SafeKeySpaceModuleSetup$Type["abi"]>({ readClient, writeClient: deployerClient }, factoryAddress, SafeKeySpaceModuleSetupArtifact)
        const module = await deploySingleton({ readClient, writeClient: deployerClient }, factoryAddress, SafeKeySpaceModuleArtifact)
        const guard = await deploySingleton({ readClient, writeClient: deployerClient }, factoryAddress, SafeDisableExecTransactionGuardArtifact, [module.address])
        try { // if already deployed and initialized
            await module.write.initialize([keystoreAddress, stateVerifierAddress, guard.address])
        } catch (e) {
            console.log(`Error when calling initialize`)
            console.log(e)
        }

        console.log(`========================== SINGLETONS ===========================`)
        console.log("safeProxyFactory address: " + safeProxyFactory.address);
        console.log("safeMastercopy address: " + safeMastercopy.address);
        console.log("safeMultiSend address: " + safeMultiSend.address);
        console.log("safeMultiSendCallOnly address: " + safeMultiSendCallOnly.address);
        console.log("safeFallbackHandler address: " + safeFallbackHandler.address);
        console.log("safeSignMessageLib address: " + safeSignMessageLib.address);
        console.log("safeCreateCall address: " + safeCreateCall.address);
        console.log("safeSimulateTxAccessor address: " + safeSimulateTxAccessor.address);
        console.log("safeKeySpaceModule address: " + module.address);
        console.log("safeKeySpaceModuleSetup address: " + moduleSetup.address);
        console.log("SafeDisableExecTransactionGuard address: " + guard.address);
        console.log("Keystore address: " + keystoreAddress);
        console.log("StateVerifier address: " + stateVerifierAddress);
        console.log(`============================================================`)
    });
