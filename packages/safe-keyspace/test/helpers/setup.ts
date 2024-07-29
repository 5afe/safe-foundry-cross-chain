import hre from "hardhat";
import deploySafeProxy from '../../common/deploySafeProxy'
import deploySingletons, { deploySingleton } from '../../common/deploySingletons'
import { parseEther } from "viem";
import MockedKeystoreArtifact from "../../artifacts/contracts/test/MockedKeystore.sol/MockedKeystore.json"
import StateVerifierArtifact from "../../artifacts/contracts/libs/StateVerifier.sol/StateVerifier.json"
import SafeKeySpaceModuleArtifact from "../../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule.json"
import SafeDisableLocalKeystoreGuardArtifact from "../../artifacts/contracts/SafeDisableExecTransactionGuard.sol/SafeDisableExecTransactionGuard.json"
import { MockedKeystore$Type } from "../../artifacts/contracts/test/MockedKeystore.sol/MockedKeystore";
import { StateVerifier$Type } from "../../artifacts/contracts/libs/StateVerifier.sol/StateVerifier";
import { SafeKeySpaceModule$Type } from "../../artifacts/contracts/SafeKeySpaceModule.sol/SafeKeySpaceModule";
import { SafeDisableExecTransactionGuard$Type } from "../../artifacts/contracts/SafeDisableExecTransactionGuard.sol/SafeDisableExecTransactionGuard";

const KEYSTORE_ROOT_HASH = 18922104752410089181190121137101702179191413010695720107096429999419838202820n

export default async function setup() {
  await hre.run("compile")
  const readClient = await hre.viem.getPublicClient();
  const [owner, relayer] = await hre.viem.getWalletClients();

  const threshold = 1

  // Deploy singletons factory and singletons
  const { factoryAddress, singletons: { safeProxyFactory, safeMastercopy } } = await deploySingletons({ readClient, writeClient: relayer })

  // Create Safe
  const safe = await deploySafeProxy({
    owners: [owner.account.address],
    threshold,
    factory: safeProxyFactory.address,
    mastercopy: safeMastercopy.address,
    clients: { readClient, writeClient: relayer }
  })

  // Deploy Test/Mocks contracts
  const keystore = await deploySingleton<MockedKeystore$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, MockedKeystoreArtifact)
  await keystore.write.setRoot([KEYSTORE_ROOT_HASH])
  const stateVerifier = await deploySingleton<StateVerifier$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, StateVerifierArtifact)
  // Not working?
  //const testToken = await deploySingleton<TestToken$Type["abi"]>(client, relayer, factoryAddress, TestTokenArtifact)
  const testToken = await hre.viem.deployContract("TestToken", [], { client: { wallet: relayer } })

  // Deploy Safe Keystore module and Guard
  const module = await deploySingleton<SafeKeySpaceModule$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, SafeKeySpaceModuleArtifact)
  const guard = await deploySingleton<SafeDisableExecTransactionGuard$Type["abi"]>({ readClient, writeClient: relayer }, factoryAddress, SafeDisableLocalKeystoreGuardArtifact, [module.address])
  await module.write.initialize([keystore.address, stateVerifier.address, guard.address])

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