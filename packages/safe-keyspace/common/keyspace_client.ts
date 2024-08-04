import { Hex, Hash, RpcSchema, Transport, Chain, Client, PublicRpcSchema, PublicActions, EIP1193RequestFn, Account } from "viem";
import { Prettify } from "viem/chains";

const stripLeadingZeros = (hex: Hex): Hex => {
    return hex.replace(/^0x0+/, "0x") as Hex;
}

export type GetValueParameters = {
    key: Hex;
};

export type GetConfigProofParameters = {
    key: Hex;
    vkHash: Hash;
    dataHash: Hash;
};

export type GetRecoverProofParameters = {
    key: Hex;
    newKey: Hex;
    circuitType: "secp256k1" | "webauthn";
    signature: Hex;
};

export type SetConfigParameters = {
    key: Hex;
    newKey: Hex;
    currentVk: Hex;
    currentData: Hex;
    proof: Hex;
}

export type GetValueReturnType = {
    value: Hex;
};

export type GetConfigProofReturnType = {
    root: Hex;
    proof: Hex;
};

export type GetRecoverProofReturnType = {
    proof: Hex;
    currentVk: Hex;
    currentData: Hex;
};

export type MKSRRpcSchema = RpcSchema & [{
    Method: "mksr_get";
    Parameters: [Hex];
    ReturnType: GetValueReturnType;
}, {
    Method: "mksr_proof";
    Parameters: [Hex, Hash, Hash];
    ReturnType: GetConfigProofReturnType;
}, {
    Method: "recover_proveSignature"; //"mksr_recover";
    Parameters: [Hex, Hex, Hex, string];
    ReturnType: GetRecoverProofReturnType;
}, {
    Method: "mksr_set";
    Parameters: [Hex, Hex, Hex, Hex, Hex];
    ReturnType: null;
}];

export type KeyspaceClient<
    transport extends Transport = Transport,
    chain extends Chain | undefined = Chain | undefined,
> = Prettify<
    Client<
        transport,
        chain,
        undefined,
        PublicRpcSchema & MKSRRpcSchema,
        PublicActions<transport, chain> & KeyspaceActions
    >
>;

export async function getValue<
    TChain extends Chain | undefined,
>(
    client: Client<Transport, TChain>,
    parameters: GetValueParameters,
): Promise<GetValueReturnType> {
    const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
    return await request({
        method: "mksr_get",
        params: [stripLeadingZeros(parameters.key)],
    });
}

export async function getConfigProof<
    TChain extends Chain | undefined,
>(
    client: Client<Transport, TChain>,
    parameters: GetConfigProofParameters,
): Promise<GetConfigProofReturnType> {
    const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
    return await request({
        method: "mksr_proof",
        params: [stripLeadingZeros(parameters.key), stripLeadingZeros(parameters.vkHash), stripLeadingZeros(parameters.dataHash)],
    });
}

export async function getRecoverProof<
    TChain extends Chain | undefined,
>(
    client: Client<Transport, TChain>,
    parameters: GetRecoverProofParameters,
): Promise<GetRecoverProofReturnType> {
    const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
    return await request({
        method: "recover_proveSignature", //"mksr_recover",
        params: [stripLeadingZeros(parameters.key), stripLeadingZeros(parameters.newKey), parameters.signature, parameters.circuitType],
    });
}

export async function setConfig<
    TChain extends Chain | undefined,
>(
    client: Client<Transport, TChain>,
    parameters: SetConfigParameters,
): Promise<null> {
    const request = client.request as EIP1193RequestFn<MKSRRpcSchema>;
    return await request({
        method: "mksr_set",
        params: [stripLeadingZeros(parameters.key), stripLeadingZeros(parameters.newKey), parameters.currentVk, parameters.currentData, parameters.proof],
    });
}

export type KeyspaceActions = {
    getValue: (parameters: GetValueParameters) => Promise<GetValueReturnType>;
    getConfigProof: (parameters: GetConfigProofParameters) => Promise<GetConfigProofReturnType>;
    setConfig: (parameters: SetConfigParameters) => Promise<null>;
}

export function keyspaceActions() {
    return <
        transport extends Transport,
        chain extends Chain | undefined = Chain | undefined,
        account extends Account | undefined = Account | undefined,
    >(
        client: Client<transport, chain, account>,
    ): KeyspaceActions => {
        return {
            getValue: (parameters) => getValue(client, parameters),
            getConfigProof: (parameters) => getConfigProof(client, parameters),
            setConfig: (parameters) => setConfig(client, parameters),
        };
    }
}
export type KeyspaceRecovryActions = {
    getRecoverProof: (parameters: GetRecoverProofParameters) => Promise<GetRecoverProofReturnType>;
}

export function keyspaceRecoveryActions() {
    return <
        transport extends Transport,
        chain extends Chain | undefined = Chain | undefined,
        account extends Account | undefined = Account | undefined,
    >(
        client: Client<transport, chain, account>,
    ): KeyspaceRecovryActions => {
        return {
            getRecoverProof: (parameters) => getRecoverProof(client, parameters),
        };
    }
}