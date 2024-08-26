'use-client';
import { Address, encodeFunctionData, erc20Abi, formatUnits, getAddress, Hex, isAddress, parseUnits } from "viem";
import { useEffect, useState } from "react";
import { useAccountEffect, useWalletClient } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { ConnectButton, Chain } from "@rainbow-me/rainbowkit";
import { Badge, Spinner } from "flowbite-react";
import Button from "../components/button";
import { acrossBridgePlugin } from "../../../common/across-bridge-plugin";
import { WriteClient } from "../../../common/types";
import { KlasterSDK, SafeV141AccountInitData, MultichainClient, MultichainTokenMapping, initKlaster, loadSafeV141Account, klasterNodeHost, buildMultichainReadonlyClient, buildRpcInfo, buildTokenMapping, deployment, UnifiedBalanceResult, encodeBridgingOps, buildItx, rawTx, getTokenAddressForChainId, singleTx } from "klaster-sdk";
import InputText, { InputField } from "../components/input_text";
import { isFloat, isInt } from "../utils/number";
import { formatHex } from "../utils/hex";
import { Clipboard } from "flowbite-react"
import { FaCopy, FaRegStar } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";

type ChainInfo = {
    [id: number]: {
        id: number,
        chain: Chain,
        usdc: Address
    }
}

type KlasterInfo = {
    klaster: KlasterSDK<SafeV141AccountInitData>;
    mcClient: MultichainClient;
    mUSDC: MultichainTokenMapping;
    safeAddr: Address
}

type TxInfo = {
    status: "IN_PROGRESS" | "SUCCESS" | "FAILED",
    sourceChain: number,
    targetChain: number,
    to: Address,
    amount: bigint,
    error?: string,
    hash?: string
}


const SEND_TO_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }
const SEND_AMOUNT_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }

const CHAINS: ChainInfo = {
    [sepolia.id]: {
        id: sepolia.id,
        chain: sepolia,
        usdc: getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
    },
    [baseSepolia.id]: {
        id: baseSepolia.id,
        chain: baseSepolia,
        usdc: getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e")
    }
}

const loadKlasterInstance = async (signerAddr: Address): Promise<KlasterInfo> => {
    console.log(`loadKlasterInstance(signer: ${signerAddr})`)

    const klaster = await initKlaster({
        accountInitData: loadSafeV141Account({
            signers: [signerAddr],
            threshold: 1n,
        }),
        nodeUrl: klasterNodeHost.default,
    });

    const mcClient = buildMultichainReadonlyClient(
        Object.values(CHAINS).map(c => buildRpcInfo(c.id, c.chain.rpcUrls.default.http[0]))
    );

    const mUSDC = buildTokenMapping(
        Object.values(CHAINS).map(c => deployment(c.id, c.usdc))
    )

    return {
        klaster,
        mcClient,
        mUSDC,
        safeAddr: klaster.account.getAddress(sepolia.id) as Address
    }
}

const loadUnifiedBalance = async ({ klaster, mcClient, mUSDC, safeAddr }: KlasterInfo): Promise<UnifiedBalanceResult> => {
    console.log(`loadUnifiedBalance(safeAddr: ${safeAddr})`)
    const uBalance = await mcClient.getUnifiedErc20Balance({
        tokenMapping: mUSDC,
        account: klaster.account
    })
    return uBalance
}

const bridgeFund = async (
    { klaster, mcClient, mUSDC }: KlasterInfo,
    unifiedBalance: UnifiedBalanceResult,
    signer: WriteClient,
    txInfo: TxInfo,
    setTxInfo: (txInfo: TxInfo) => void
): Promise<void> => {
    console.log(`===> bridgeFund`)

    try {
        const bridgingOps = await encodeBridgingOps({
            tokenMapping: mUSDC,
            account: klaster.account,
            amount: txInfo.amount,
            bridgePlugin: acrossBridgePlugin,
            client: mcClient,
            destinationChainId: txInfo.targetChain,
            unifiedBalance
        })
        console.log(`====> bridgingOps`)
        console.log(bridgingOps)

        const destChainTokenAddress = getTokenAddressForChainId(mUSDC, txInfo.targetChain)!

        const sendERC20Op = rawTx({
            gasLimit: 100000n,
            to: destChainTokenAddress,
            data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'transfer',
                args: [
                    txInfo.to,
                    bridgingOps.totalReceivedOnDestination
                ]
            })
        })

        const iTx = buildItx({
            steps: bridgingOps.steps
            // .concat(
            //     singleTx(txInfo.targetChain, sendERC20Op)
            // )
            ,
            feeTx: klaster.encodePaymentFee(sepolia.id, 'USDC')
        })
        console.log(`====> iTx`)
        console.log(iTx)

        const quote = await klaster.getQuote(iTx)

        console.log(`====> quote`)
        console.log(quote)

        // Sign the quote (implement this based on your signing method)
        console.log(`====> sign (signer = ${signer.account.address})`)
        const signed = await signer.signMessage({ message: { raw: quote.itxHash } });
        console.log(`====> signed`)
        console.log(signed)

        // Execute the transaction
        const result = await klaster.execute(quote, signed);
        console.log(`====> result`)
        console.log(result)

        setTxInfo({
            ...txInfo,
            status: "SUCCESS",
            hash: result.itxHash
        })

    } catch (e) {
        console.log(`====> ERROR: ${e}`)
        setTxInfo({
            ...txInfo,
            status: "FAILED",
            error: (e as Error).message
        })
    }
}


function Connect() {
    const { data: signer, isLoading } = useWalletClient()
    const [klasterInfo, setKlasterInfo] = useState<KlasterInfo>();
    const [klasterUnifiedBalance, setKlasterUnifiedBalance] = useState<UnifiedBalanceResult>();
    const [toField, setToField] = useState<InputField>(SEND_TO_FIELD_INIT)
    const [amountField, setAmountField] = useState<InputField>(SEND_AMOUNT_FIELD_INIT)
    const [txInfo, setTxInfo] = useState<TxInfo | undefined>()

    useAccountEffect({
        onConnect: async ({ address }: any) => {
            const k = await loadKlasterInstance(address)
            setKlasterInfo(k)
            const b = await loadUnifiedBalance(k)
            setKlasterUnifiedBalance(b)
        },
        onDisconnect: () => { },
    })

    useEffect(() => {
        (async () => {
            if (signer) {
                const k = await loadKlasterInstance(signer.account.address)
                setKlasterInfo(k)
                const b = await loadUnifiedBalance(k)
                setKlasterUnifiedBalance(b)
            }
        })();
    }, []);

    return (
        <>
            <div className="flex w-full text-center items-center justify-center">
                {!signer && !isLoading &&
                    <ConnectButton />
                }

                {(signer || isLoading) && !klasterInfo &&
                    <Spinner color="info" size="xl" />
                }

                {signer && klasterInfo &&
                    <div>
                        <div className="flex flex-wrap gap-2 mb-12">
                            <span className="flex flex-row gap-2">
                                Safe {formatHex(klasterInfo.safeAddr)}
                                <Clipboard
                                    valueToCopy={klasterInfo.safeAddr}
                                    label={<FaCopy color="black" />}
                                    className=" px-3 py-2 h-[24px] font-medium text-center bg-gray-100 rounded-lg hover:bg-gray-100 " />

                            </span>
                            {Object.values(CHAINS).map(c => {
                                const url = `${c.chain.blockExplorers?.default.url}/address/${klasterInfo.safeAddr}`
                                return (
                                    <span className="flex items-center">
                                        <Badge><a href={url} target="_blank">{c.chain.name}</a></Badge>
                                    </span>
                                )
                            })}
                        </div>

                        <div>
                            {!klasterUnifiedBalance &&
                                <Spinner color="info" size="xl" />}

                            {klasterUnifiedBalance &&
                                <div className="flex flex-col justify-center">
                                    <p className="flex flex-row items-center gap-2">
                                        <span>Total Balance </span>
                                        <span className="flex flex-row gap-2 items-center">
                                            {formatUnits(klasterUnifiedBalance.balance, klasterUnifiedBalance.decimals)}
                                            <Badge>USDC</Badge>
                                        </span>
                                        <span className="flex items-center cursor-pointer">
                                            <LuRefreshCw
                                                size={12}
                                                color="black"
                                                onClick={async () => {
                                                    setKlasterUnifiedBalance(undefined)
                                                    const b = await loadUnifiedBalance(klasterInfo)
                                                    setKlasterUnifiedBalance(b)
                                                }} />
                                        </span>
                                    </p>

                                    {klasterUnifiedBalance.breakdown.map(b =>
                                        <p className="flex flex-row gap-2 items-center">
                                            <FaRegStar />
                                            {CHAINS[b.chainId].chain.name}: {formatUnits(b.amount, klasterUnifiedBalance.decimals)} <Badge>USDC</Badge></p>
                                    )}
                                </div>
                            }
                        </div>

                        <div className="flex justify-center mt-8">
                            {klasterUnifiedBalance &&
                                <div className="flex flex-wrap">
                                    <div className="w-full space-y-2">
                                        <InputText
                                            label="To"
                                            placeholder="0x..."
                                            field={toField}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const to = e.currentTarget.value
                                                if (to == "") {
                                                    setToField(SEND_TO_FIELD_INIT)
                                                    return;
                                                }
                                                if (!isAddress(to)) {
                                                    setToField({ value: to, hasError: true, message: "Invalid Address" })
                                                    return;
                                                }
                                                setToField({ value: to, hasError: false, message: "" })
                                            }} />
                                            
                                        <InputText
                                            label="Amount"
                                            placeholder="0.1"
                                            field={amountField}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const amount = e.currentTarget.value
                                                if (amount == "") {
                                                    setAmountField(SEND_AMOUNT_FIELD_INIT)
                                                    return;
                                                }
                                                if ((!isInt(amount) && !isFloat(amount)) || parseFloat(amount) <= 0) {
                                                    setAmountField({ value: amount, hasError: true, message: "Invalid number" })
                                                    return;
                                                }
                                                setAmountField({ value: amount, hasError: false, message: "" })
                                            }} />

                                        <Button
                                            text="Bridge USDC to Base Sepolia"
                                            className="w-full"
                                            disabled={false}
                                            isLoading={txInfo?.status === "IN_PROGRESS"}
                                            onClick={async () => {
                                                const txInfo: TxInfo = {
                                                    status: "IN_PROGRESS",
                                                    sourceChain: sepolia.id,
                                                    targetChain: baseSepolia.id,
                                                    to: toField.value as Address,
                                                    amount: parseUnits(amountField.value, klasterUnifiedBalance.decimals),
                                                }
                                                setTxInfo(txInfo)
                                                await bridgeFund(
                                                    klasterInfo,
                                                    klasterUnifiedBalance,
                                                    signer as WriteClient,
                                                    txInfo,
                                                    setTxInfo)
                                            }}
                                        />
                                        {txInfo?.error &&
                                            <div>
                                                <span className="text-xs text-red-500">
                                                    {txInfo.error}
                                                </span>
                                            </div>
                                        }
                                        {txInfo?.hash &&
                                            <div>
                                                <span className="text-xs text-green-500">
                                                    <a href={`https://explorer.klaster.io/details/${txInfo?.hash}`} target="_blank">
                                                        {txInfo?.hash}
                                                    </a>
                                                </span>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
        </>
    )
}

export default Connect


