
import { task } from "hardhat/config";
import { deploySafeProxy } from "../common/deploySafeProxy";


task("deploy_safe", "Deploys a Safe proxy (single owner)")
  .addParam("factory", "The factory address", "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67")
  .addParam("mastercopy", "The masterCopy address", "0x29fcB43b46531BcA003ddC8FCB67FFE91900C762")
  // .addParam("multisend", "The Multisend address")
  // .addParam("ownerpk", "The owner private key")
  .addParam("salt", "Salt to be used for deterministic (CREATE2) deployment", "0x0000000000000000000000000000000000000000000000000000000000000000")
  .setAction(async (taskArgs, hre) => {
    await hre.run("compile");

    const readClient = await hre.viem.getPublicClient();
    const [relayerClient] = await hre.viem.getWalletClients()

    const owner = relayerClient.account.address

    const safe = await deploySafeProxy({
      owners: [owner],
      threshold: 1,
      factory: taskArgs.factory,
      mastercopy: taskArgs.mastercopy,
      options: {
        salt: taskArgs.salt
      },
      clients: { readClient, writeClient: relayerClient }
    })

    await hre.run("get_safe", { safe: safe.address });
  });