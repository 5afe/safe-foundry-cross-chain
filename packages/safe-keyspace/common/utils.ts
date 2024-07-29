

import { Abi, Account, Address, Chain, Client, Hex, WalletClient, Signature, Transport, bytesToHex, createWalletClient, encodePacked, fromHex, getAddress, getContract, hashMessage, http, recoverPublicKey, toHex } from 'viem'
import { BrowserProvider, JsonRpcSigner } from "ethers"
import { secp256k1 } from "@noble/curves/secp256k1"
import { privateKeyToAccount } from 'viem/accounts'
import { TestToken$Type } from '../artifacts/contracts/test/TestToken.sol/TestToken'
import { ABI } from './artifacts'
import { Clients, ContractInstance, ContractInstanceReadOnly, PublicKeyPoints, ReadClient, WriteClient } from './types'

export const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex
export const ZERO_ADDRESS = getAddress("0x0000000000000000000000000000000000000000")

export const getRandomBytes = (size = 32): Hex => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(size))
    return bytesToHex(randomBytes)
}

export const getETHBalance = async (client: ReadClient, address: Address) => {
    return client.getBalance({ address })
}

export const getERC20Balance = async (token: ContractInstanceReadOnly<TestToken$Type["abi"]>, address: Address) => {
    return token.read.balanceOf([address])
}

export async function isContract(client: ReadClient, address: Address) {
    const code = await client.getBytecode({
        address,
    })
    return code !== undefined
}

export function pkToWalletClient(client: Client<Transport, Chain>, pk: Hex): WriteClient {
    return createWalletClient({
        account: privateKeyToAccount(pk),
        chain: client.chain,
        transport: http()
    })
}

export function walletToSigner(wallet: WriteClient) {
    const { account, chain, transport } = wallet
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    const provider = new BrowserProvider(transport, network)
    const signer = new JsonRpcSigner(provider, account.address)
    return signer
}

const formatPublicKey = (publicKey: Hex): PublicKeyPoints => {
    const publicKeyBytes = fromHex(publicKey, "bytes")
    const encodingByte = publicKeyBytes.slice(0, 1);
    if (encodingByte[0] !== 4) {
        throw new Error("Invalid public key encoding");
    }

    return {
        x: toHex(publicKeyBytes.slice(1, 33)),
        y: toHex(publicKeyBytes.slice(33, 65)),
    }
}

export const extractPublicKeyFromWalletClient = async (client: WriteClient): Promise<PublicKeyPoints> => {
    // This is a trick to obtain a public key from a viem's WalletClient...
    const message = getRandomBytes(32)
    const signature = await client.signMessage({ message })
    const publicKey = await recoverPublicKey({ hash: hashMessage(message), signature })
    return formatPublicKey(publicKey)
}

export const getPublicKeyFromPrivateKey = (privateKey: Hex): PublicKeyPoints => {
    const publicKey = secp256k1.getPublicKey(privateKey.slice(2), false)
    return formatPublicKey(toHex(publicKey))
}

export const getContractInstance = <const TAbi extends Abi>(
    abi: TAbi,
    address: Address,
    { readClient, writeClient }: Clients)
    : ContractInstance<TAbi> => {
    return getContract({
        address,
        abi,
        client: { public: readClient, wallet: writeClient }
    })
}

export const getContractInstanceReadOnly = <const TAbi extends Abi>(
    abi: TAbi,
    address: Address,
    readClient: ReadClient) => {
    return getContract({
        address,
        abi,
        client: { public: readClient }
    })
}

export const encodeSignature = (signature: Signature): Hex => {
    return encodePacked(
        ["bytes32", "bytes32", "uint8"],
        [
            signature.r,
            signature.s,
            parseInt((signature.v || 0).toString()),
        ],
    )
}

export const waitForTransaction = async (client: ReadClient, hash: Hex): Promise<void> => {
    const chainId = await client.getChainId()
    const confirmations = chainId === 31337 ? 0 : Number(process.env.CONFIRMATION_BLOCKS || 3)

    const receipt = await client.waitForTransactionReceipt({
        hash,
        confirmations
    })

    if (receipt.status === "reverted") {
        console.error(`Transaction ${hash} failed`)
    }
}

export const getSafeInfo = async (client: ReadClient, address: Address) => {
    const safe = getContractInstanceReadOnly(ABI.ISafeABI, address, client)

    const [version, owners, nonce, threshold, [modules], balance] = await Promise.all([
        safe.read.VERSION(),
        safe.read.getOwners(),
        safe.read.nonce(),
        safe.read.getThreshold(),
        safe.read.getModulesPaginated(["0x0000000000000000000000000000000000000001", 10n]),
        client.getBalance({ address })
    ])

    return {
        address,
        version,
        owners,
        threshold,
        nonce,
        modules,
        balance,
    }
}