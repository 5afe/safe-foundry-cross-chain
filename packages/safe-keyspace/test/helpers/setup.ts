import hre from "hardhat";
import deploySingletons, { deploySingleton } from '../../common/deploySingletons'
import { encodeFunctionData, fromHex, parseEther } from "viem";
import MockedKeystoreArtifact from "../../artifacts/contracts/test/MockedKeystore.sol/MockedKeystore.json"
import StateVerifierArtifact from "../../artifacts/contracts/libs/StateVerifier.sol/StateVerifier.json"
import SafeKeySpaceModuleArtifact from "../../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule.json"
import SafeKeySpaceModuleSetupArtifact from "../../artifacts/contracts/SafeKeySpaceModuleSetup.sol/SafeKeySpaceModuleSetup.json"
import SafeDisableLocalKeystoreGuardArtifact from "../../artifacts/contracts/SafeDisableExecTransactionGuard.sol/SafeDisableExecTransactionGuard.json"
import { MockedKeystore$Type } from "../../artifacts/contracts/test/MockedKeystore.sol/MockedKeystore";
import { StateVerifier$Type } from "../../artifacts/contracts/libs/StateVerifier.sol/StateVerifier";
import { SafeKeySpaceModule$Type } from "../../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule";
import { SafeDisableExecTransactionGuard$Type } from "../../artifacts/contracts/SafeDisableExecTransactionGuard.sol/SafeDisableExecTransactionGuard";
import { SafeKeySpaceModuleSetup$Type } from "../../artifacts/contracts/SafeKeySpaceModuleSetup.sol/SafeKeySpaceModuleSetup";
import { calculateSafeProxyAddress, deploySafeProxy } from "../../common/deploySafeProxy";
import { encodeMultiSend, extractPublicKeyFromWalletClient, getRandomBytes } from "../../common/utils";
import { getKeyspaceKey } from "../../common/keybase";

const KEYSTORE_ROOT_HASH = 18771300679865010293167752034693535567812946484477666775367256618114830841022n

export default async function setup() {
  await hre.run("compile")
  const readClient = await hre.viem.getPublicClient();
  const [owner, relayer] = await hre.viem.getWalletClients();

  const threshold = 1

  // Deploy singletons factory and singletons
  const { factoryAddress, singletons: { safeProxyFactory, safeMastercopy, safeMultiSend } } = await deploySingletons({ readClient, writeClient: relayer })

  // Deploy Test/Mocks contracts
  const keystore = await deploySingleton<MockedKeystore$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, MockedKeystoreArtifact)
  await keystore.write.setRoot([KEYSTORE_ROOT_HASH])
  const stateVerifier = await deploySingleton<StateVerifier$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, StateVerifierArtifact)
  // Not working?
  //const testToken = await deploySingleton<TestToken$Type["abi"]>(client, relayer, factoryAddress, TestTokenArtifact)
  const testToken = await hre.viem.deployContract("TestToken", [], { client: { wallet: relayer } })

  // Deploy Safe Module setup, Safe Keystore module and Guard
  const moduleSetup = await deploySingleton<SafeKeySpaceModuleSetup$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, SafeKeySpaceModuleSetupArtifact)
  const module = await deploySingleton<SafeKeySpaceModule$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, SafeKeySpaceModuleArtifact)
  const guard = await deploySingleton<SafeDisableExecTransactionGuard$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, SafeDisableLocalKeystoreGuardArtifact, [module.address])
  await module.write.initialize([keystore.address, stateVerifier.address, guard.address])

  const publicKey = await extractPublicKeyFromWalletClient(owner)
  const keystoreKey = getKeyspaceKey(publicKey)

  const safe = await deploySafeProxy({
    owners: [owner.account.address],
    threshold,
    factory: safeProxyFactory.address,
    mastercopy: safeMastercopy.address,
    options: {
      callback: {
        to: safeMultiSend.address,
        data: encodeFunctionData({
          abi: safeMultiSend.abi,
          functionName: 'multiSend',
          args: [encodeMultiSend([
            {
              to: moduleSetup.address,
              data: encodeFunctionData({
                abi: moduleSetup.abi,
                functionName: 'enableModule',
                args: [module.address]
              }),
            },
            {
              to: moduleSetup.address,
              data: encodeFunctionData({
                abi: moduleSetup.abi,
                functionName: 'configureModule',
                args: [module.address, fromHex(keystoreKey, "bigint")],
              }),
            }
          ])]
        }),
      }
    },
    clients: { readClient, writeClient: relayer }
  })

  // fund the safe (1 ETH)
  await owner.sendTransaction({
    to: safe.address,
    value: parseEther('1'),
  })

  // fund the safe (1000 TT)
  await testToken.write.transfer([safe.address, 1000n])

  return {
    clients: { readClient, writeClient: relayer },
    safe,
    module,
    guard,
    testToken,
    owner
  }
}