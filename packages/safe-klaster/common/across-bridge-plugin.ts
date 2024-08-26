import axios from "axios";
import { Address, batchTx, BridgePlugin, BridgePluginParams, encodeApproveTx, rawTx } from "klaster-sdk";
import { encodeFunctionData, parseAbi } from "viem";

async function getAcrossSuggestedFees(
    data: BridgePluginParams
) {
    console.log(`getAcrossSuggestedFees`)
    const client = axios.create({
        baseURL: 'https://testnet.across.to/api/'
    })

    console.log(`URL = https://testnet.across.to/api/` +
        `suggested-fees?inputToken=${data.sourceToken}&outputToken=${data.destinationToken}&` +
        `originChainId=${data.sourceChainId}&destinationChainId=${data.destinationChainId}&amount=${data.amount}`
    )

    const res = await client.get<RelayFeeResponse>(
        `suggested-fees?inputToken=${data.sourceToken}&outputToken=${data.destinationToken}&` +
        `originChainId=${data.sourceChainId}&destinationChainId=${data.destinationChainId}&amount=${data.amount}`
    )


    console.log(`result = ${JSON.stringify(res.data)}`)

    return res.data
}

function encodeAcrossCallData(data: BridgePluginParams, fees: RelayFeeResponse) {
    const abi = parseAbi([
        'function depositV3(address depositor, address recipient, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 destinationChainId, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityDeadline, bytes calldata message) external',
    ]);
    const outputAmount = data.amount - BigInt(fees.totalRelayFee.total);
    const fillDeadline = Math.round(Date.now() / 1000) + 300;

    const [srcAddress, destAddress] = data.account.getAddresses([data.sourceChainId, data.destinationChainId])
    if (!srcAddress || !destAddress) { throw Error(`Can't fetch address from multichain account for ${data.sourceChainId} or ${data.destinationChainId}`) }

    return encodeFunctionData({
        abi: abi,
        functionName: 'depositV3',
        args: [
            srcAddress,
            destAddress,
            data.sourceToken,
            data.destinationToken,
            data.amount,
            outputAmount,
            BigInt(data.destinationChainId),
            fees.exclusiveRelayer,
            parseInt(fees.timestamp),
            fillDeadline,
            parseInt(fees.exclusivityDeadline),
            '0x',
        ],
    });

}

export const acrossBridgePlugin: BridgePlugin = async (data: BridgePluginParams) => {
    console.log(`=>>> acrossBridgePlugin`)

    const feesResponse = await getAcrossSuggestedFees(data)
    const outputAmount = data.amount - BigInt(feesResponse.totalRelayFee.total);

    // Approve sourceToken to the Across pool contract (for source chain)
    const acrossApproveTx = encodeApproveTx({
        tokenAddress: data.sourceToken,
        amount: outputAmount,
        recipient: feesResponse.spokePoolAddress
    })

    // Call across pool to initiate bridging
    const acrossCallTx = rawTx({
        to: feesResponse.spokePoolAddress,
        data: encodeAcrossCallData(data, feesResponse),
        gasLimit: BigInt(250000)
    })

    return {
        receivedOnDestination: outputAmount,
        txBatch: batchTx(data.sourceChainId, [acrossApproveTx, acrossCallTx])
    }

};


interface FeeObject {
    pct: string;
    total: string;
}

interface Limits {
    minDeposit: string;
    maxDeposit: string;
    maxDepositInstant: string;
    maxDepositShortDelay: string;
    recommendedDepositInstant: string;
}

interface RelayFeeResponse {
    estimatedFillTimeSec: number;
    capitalFeePct: string;
    capitalFeeTotal: string;
    relayGasFeePct: string;
    relayGasFeeTotal: string;
    relayFeePct: string;
    relayFeeTotal: string;
    lpFeePct: string;
    timestamp: string;
    isAmountTooLow: boolean;
    quoteBlock: string;
    exclusiveRelayer: Address;
    exclusivityDeadline: string;
    spokePoolAddress: Address;
    totalRelayFee: FeeObject;
    relayerCapitalFee: FeeObject;
    relayerGasFee: FeeObject;
    lpFee: FeeObject;
    limits: Limits;
}