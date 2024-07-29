import { task } from "hardhat/config";
import { formatEther, toHex } from "viem";
import { getContractInstanceReadOnly } from "../common/utils";
import { ABI } from "../common/artifacts"
import { getValue } from "../test/helpers/keybase";

task("get_safe", "Get Safe details")
  .addParam("safe", "The Safe address")
  .setAction(async (taskArgs, hre) => {
    await hre.run("compile");

    const readClient = await hre.viem.getPublicClient();

    const safe = getContractInstanceReadOnly(ABI.ISafeABI, taskArgs.safe, readClient)

    const [version, owners, nonce, threshold, [modules], balance] = await Promise.all([
      safe.read.VERSION(),
      safe.read.getOwners(),
      safe.read.nonce(),
      safe.read.getThreshold(),
      safe.read.getModulesPaginated(["0x0000000000000000000000000000000000000001", 10n]),
      readClient.getBalance({ address: taskArgs.safe })
    ])

    const module = getContractInstanceReadOnly(ABI.SafeKeySpaceModuleABI, modules[0], readClient)
    const [keyspaceKey, keyspaceKeyNonce, keystoreAddr] = await Promise.all([
      module.read.keyspaceKeys([taskArgs.safe]),
      module.read.nonces([taskArgs.safe]),
      module.read.keyStore()
    ])

    const keystore = getContractInstanceReadOnly(ABI.MockedKeystoreABI, keystoreAddr, readClient)
    const [keyspaceValue, keystoreRoot] = await Promise.all([
      getValue(toHex(keyspaceKey)),
      keystore.read.root()
    ])

    console.log(`========================== SAFE ===========================`)
    console.log(`=== Network: ${hre.network.name}`)
    console.log(`=== Safe Address: ${taskArgs.safe}`)
    console.log(`=== Safe Version: ${version}`)
    console.log(`=== Safe Owners: ${owners.join(", ")}`)
    console.log(`=== Safe Threshold: ${threshold}`)
    console.log(`=== Safe Nonce: ${nonce}`)
    console.log(`=== Safe Modules: ${modules.join(", ")}`)
    console.log(`=== KeySpace Key: ${toHex(keyspaceKey)}`)
    console.log(`=== KeySpace Value: ${keyspaceValue}`)
    console.log(`=== KeySpace Key nonce: ${keyspaceKeyNonce}`)
    console.log(`=== Keystore root ${keystoreRoot}`)
    console.log(`=== Safe Balance: ${formatEther(balance)} ETH`)
    console.log(`============================================================`)
  });