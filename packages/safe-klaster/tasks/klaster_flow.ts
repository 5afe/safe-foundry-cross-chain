import { task } from "hardhat/config";
import { Address } from "viem";
import { getSafeInfo } from "../common/utils";
import { buildMultichainReadonlyClient, buildRpcInfo, buildTokenMapping, deployment, initKlaster, klasterNodeHost, loadSafeV141Account } from "klaster-sdk";
import { baseSepolia, sepolia } from "viem/chains";

task("klaster_flow", "")
  .addParam("safe", "The Safe address")
  .setAction(async (taskArgs, hre) => {
    console.log(`====> klaster_flow (safe: ${taskArgs.safe})`)
    await hre.run("compile");

    const readClient = await hre.viem.getPublicClient();
    const safe = await getSafeInfo(readClient, taskArgs.safe)

    console.log(`====> initKlaster`)
    console.log(`====> args: ${JSON.stringify({
        accountInitData: loadSafeV141Account({
          signers: safe.owners as Address[],
          threshold: safe.threshold
        }),
        nodeUrl: klasterNodeHost.default,
      })}`)
    const klaster = await initKlaster({
        accountInitData: loadSafeV141Account({
          signers: safe.owners as Address[],
          threshold: safe.threshold
        }),
        nodeUrl: klasterNodeHost.default,
      });

      console.log(`====> buildMultichainReadonlyClient`)
      const mcClient = buildMultichainReadonlyClient([
        buildRpcInfo(sepolia.id, sepolia.rpcUrls.default.http[0]),
        buildRpcInfo(baseSepolia.id, baseSepolia.rpcUrls.default.http[0]),
      ]);

      console.log(`====> buildTokenMapping`)
      const mUSDC = buildTokenMapping([
        deployment(sepolia.id, '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
        deployment(baseSepolia.id, '0x036CbD53842c5426634e7929541eC2318f3dCF7e')
      ])

      const uBalance = await mcClient.getUnifiedErc20Balance({
        tokenMapping: mUSDC,
        account: klaster.account
      })

      console.log(`=====> uBalance = ${JSON.stringify(uBalance)}`)
  });