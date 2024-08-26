
import hre from "hardhat";
import { parseUnits } from "viem";
import { optimism } from 'viem/chains';
import { initKlaster } from 'klaster-sdk';

describe('KlasterTest', () => {

    it('test1', async () => {
        const [client] = await hre.viem.getWalletClients()
        const [address] = await client.getAddresses();
        console.log(`-> address: ${address}`)

        const sdk = await initKlaster({
            masterAddress: address,
            nodeUrl: 'https://klaster-node.polycode.sh/v2/',
        });
    })

})