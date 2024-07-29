
import { Hex, createPublicClient, fromHex, http, keccak256, toHex } from 'viem'
import { poseidonPerm } from '@zk-kit/poseidon-cipher'
import { baseSepolia } from "viem/chains";
import { GetConfigProofReturnType, GetRecoverProofReturnType, GetValueReturnType, keyspaceActions, keyspaceRecoveryActions } from './keyspace_client';
import { PublicKeyPoints } from '../../common/types';

// /!\ Generated KZG commitment instead of one with a trusted setup.
export const VK_HASH = "0xe513408e896618fd2b4877b44ecc81e6055647f6abb48e0356384fc63b2f72";

const poseidon = (inputs: bigint[]): bigint => poseidonPerm([BigInt(0), ...inputs.map((x) => BigInt(x))])[0];

const KEYSPACE_CLIENT = createPublicClient({
    chain: baseSepolia,
    transport: http(
        process.env.KEYSPACE_RPC_URL || "https://sepolia-alpha.key.space",
        {
            retryCount: 0,
            timeout: 120_000,

        },
    ),
}).extend(keyspaceActions());

const KEYSPACE_CLIENT_RECOVERY = createPublicClient({
    chain: baseSepolia,
    transport: http(
        process.env.KEYSPACE_RECOVERY_RPC_URL || "http://localhost:8555",
        {
            retryCount: 0,
            timeout: 120_000,

        },
    ),
}).extend(keyspaceRecoveryActions());

export const getValue = async (key: Hex): Promise<GetValueReturnType> => {
    const value = await KEYSPACE_CLIENT.getValue({
        key
    });
    return value;
}

export const getProof = async (key: Hex, vkHash: Hex, dataHash: Hex): Promise<GetConfigProofReturnType> => {
    const keyspaceProof = await KEYSPACE_CLIENT.getConfigProof({
        key,
        vkHash,
        dataHash,
    });
    return keyspaceProof;
}

export const getRecoverProof = async (key: Hex, newKey: Hex, signature: Hex): Promise<GetRecoverProofReturnType> => {
    const keyspaceRecoverProof = await KEYSPACE_CLIENT_RECOVERY.getRecoverProof({
        key,
        newKey,
        circuitType: "secp256k1",
        signature,
    });
    return keyspaceRecoverProof;
}

export const setConfig = async (key: Hex, newKey: Hex, recoverProof: GetRecoverProofReturnType): Promise<void> => {
    await KEYSPACE_CLIENT.setConfig({
        key,
        newKey,
        ...recoverProof
    });
}

export const getDataHash = (publicKey: PublicKeyPoints): Hex => {
    const keyspaceData = new Uint8Array(256);
    keyspaceData.set(fromHex(publicKey.x, "bytes"), 0);
    keyspaceData.set(fromHex(publicKey.y, "bytes"), 32);

    const fullHash = keccak256(keyspaceData);
    const truncatedHash = fromHex(fullHash, "bytes").slice(0, 31);

    return toHex(truncatedHash)
}

export const getKeyspaceKey = (publicKey: PublicKeyPoints): Hex => {
    const dataHash = getDataHash(publicKey)
    const keyspaceKey = toHex(poseidon([fromHex(VK_HASH, "bigint"), fromHex(dataHash, "bigint")]), { size: 32 })
    return keyspaceKey
}