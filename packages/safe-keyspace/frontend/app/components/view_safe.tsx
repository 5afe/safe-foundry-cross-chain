import { useState } from "react"
import InputText, { InputField } from "./form/input_text"
import { formatBigInt, formatHex, isFloat, isInt, useEthersSigner } from "../utils/utils"
import { MultiNetworkSafeInfo, SafeInfo } from "../utils/interfaces"
import { Address, formatEther, fromHex, getAddress, Hex, isAddress, parseEther, toHex } from "viem"
import Button from "./form/button"
import config from "../utils/config"
import { ABI } from "../../../common/artifacts"
import { encodeSignature, extractPublicKeyFromWalletClient, getContractInstance, getContractInstanceReadOnly } from "../../../common/utils"
import execSafeKeySpaceTransaction from "../../../common/execSafeKeySpaceTransaction";
import { useSwitchAccount, useWalletClient } from "wagmi"
import { WriteClient } from "../../../common/types"
import { getKeyspaceKey, getRecoverProof, setConfig } from "../../../common/keybase"
import { sign } from "viem/accounts"

const SEND_TO_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }
const SEND_AMOUNT_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }
const SEND_NEW_OWNER_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }

const submitPayment = async (
    {
        network,
        signer,
        safe,
        to,
        amount
    }: {
        network: string,
        signer: WriteClient,
        safe: SafeInfo,
        to: Address,
        amount: string
    }
): Promise<void> => {
    console.log(`submitPayment(network=${network}, to=${to}, amount=${amount})`)

    const readClient = network === "op_sepolia" ? config.opSepoliaClient : config.baseSepoliaClient
    const chainId = await readClient.getChainId()
    console.log(`===> network=${network} chainId=${chainId}`)
    const signerChainId = await signer.getChainId()
    console.log(`===> signerChainId=${signerChainId}`)

    console.log(`before switch chain`)
    await signer.switchChain({ id: chainId })
    console.log(`after switch chain`)
    const signerChainId2 = await signer.getChainId()
    console.log(`===> signerChainId2=${signerChainId2}`)
    // await signer.switchChain({ id: chainId })

    const safeInstance = getContractInstance(ABI.ISafeABI, safe.address, { readClient, writeClient: signer })
    const moduleInstance = getContractInstance(ABI.SafeKeySpaceModuleABI, safe.modules[0], { readClient, writeClient: signer })

    await execSafeKeySpaceTransaction({
        module: moduleInstance,
        safe: safeInstance,
        to,
        value: parseEther(amount),
        data: "0x",
        signer,
        clients: { readClient, writeClient: signer }
    })
}

function SendAsset({ network, safe }: { network: string, safe: SafeInfo }) {
    const { data: signer, isError, isLoading } = useWalletClient()

    const [toField, setToField] = useState<InputField>(SEND_TO_FIELD_INIT)
    const [amountField, setAmountField] = useState<InputField>(SEND_AMOUNT_FIELD_INIT)

    return <dialog id={"send_asset_modal_" + network} className="modal">
        <div className="modal-box">
            <h3 className="font-bold text-lg">Send <div className="badge badge-secondary">{network}</div></h3>
            <div className="flex flex-wrap">
                <div className="w-full">
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
                </div>
            </div>
            <div className="modal-action">
                <form method="dialog">
                    <div className="flex flex-row space-x-2">
                        <Button
                            text="Submit"
                            classes="btn-primary"
                            onClick={() => submitPayment({
                                network,
                                signer: signer as WriteClient,
                                safe,
                                to: getAddress(toField.value),
                                amount: amountField.value
                            })}
                            disabled={
                                toField.hasError ||
                                toField.value == "" ||
                                amountField.hasError ||
                                amountField.value == ""}
                        />
                        <Button
                            text="Close"
                            onClick={() => {
                                const doc = document.getElementById("send_asset_modal_" + network) as HTMLDialogElement
                                doc.close()
                            }}
                        />
                    </div>
                </form>
            </div>
        </div>
    </dialog>
}

function ChangeOwner({ safe }: { safe: SafeInfo }) {
    const [newOwnerKey, setNewOwnerKey] = useState<{ newKey: Hex, newKey254: Hex }>()
    const { data: signer } = useWalletClient()
    console.log(`===> signer address = ${signer?.account.address}`)

    return <dialog id="change_owner_modal" className="modal">
        <div className="modal-box">
            <h3 className="font-bold text-lg">Change Owner</h3>
            <div className="flex flex-wrap">
                <div className="w-full">
                    {!newOwnerKey && <Button
                        text="Connect your new owner wallet"
                        classes="btn-neutral"
                        onClick={async () => {
                            console.log(`===> signer address = ${signer?.account.address}`)
                            const newOwnerPublicKey = await extractPublicKeyFromWalletClient(signer as WriteClient)
                            const newKey = getKeyspaceKey(newOwnerPublicKey)
                            console.log(`====> newKeyVal = ${newKey}`)
                            const newKey254 = toHex(fromHex(newKey, "bigint") >> BigInt(2), { size: 32 })
                            console.log(`====> newKeyVal254 = ${newKey254}`)
                            setNewOwnerKey({ newKey, newKey254 })

                        }}
                        disabled={false}
                    />}
                    {newOwnerKey &&
                        <div><div className="badge">New Key</div> {formatHex(newOwnerKey.newKey)}</div>
                    }

                </div>
            </div>
            <div className="modal-action">
                <form method="dialog">
                    <div className="flex flex-row space-x-2">
                        <Button
                            text="Submit"
                            classes="btn-primary"
                            onClick={async () => {
                                console.log(`====> signer=${signer?.account.address}`)

                                const currentTargetOwnerPublicKey = await extractPublicKeyFromWalletClient(signer as WriteClient)
                                const currentKey = getKeyspaceKey(currentTargetOwnerPublicKey)
                                console.log(`====> currentKeyVal=${currentKey}`)

                                const signature = await signer?.signMessage({ message: { raw: newOwnerKey?.newKey254 as Hex } });
                                console.log(`====> signature=${signature}`)

                                const module = getContractInstanceReadOnly(
                                    ABI.SafeKeySpaceModuleABI,
                                    safe.modules[0],
                                    config.opSepoliaClient)
                                const keyspaceKey = toHex(await module.read.keyspaceKeys([safe.address]))
                                console.log(`----> keyspaceKey=${keyspaceKey}`)
                                console.log(`----> newKeVal=${newOwnerKey?.newKey}`)

                                const proof = await getRecoverProof(
                                    keyspaceKey,
                                    newOwnerKey?.newKey as Hex,
                                    signature as Hex)
                                console.log(`===> proof: ${JSON.stringify(proof)}`)

                                await setConfig(keyspaceKey, newOwnerKey?.newKey as Hex, proof)

                                console.log(`DONE`)
                            }}
                            disabled={!newOwnerKey}
                        />
                        <Button
                            text="Close"
                            onClick={() => {
                                setNewOwnerKey(undefined)
                                const doc = document.getElementById("change_owner_modal") as HTMLDialogElement
                                doc.close()
                            }}
                        />
                    </div>
                </form>
            </div>
        </div>
    </dialog>
}

function SafePanel({ network, safe }: { network: string, safe: SafeInfo }) {
    return <div className="card bg-base-100 w-96 shadow-xl">
        <div className="card-body">
            <h2 className="card-title">
                <div className="badge badge-secondary">{network}</div>
            </h2>
            <div><div className="badge">Address</div> {formatHex(safe.address)}</div>
            <div><div className="badge">Version</div> {safe.version}</div>
            <div><div className="badge">Balance</div> {formatEther(safe.balance)} ETH</div>
            <div>
                <Button
                    text="Send"
                    classes="btn-primary"
                    onClick={() => {
                        const doc = document.getElementById("send_asset_modal_" + network) as HTMLDialogElement
                        doc.showModal()
                    }}
                />
            </div>
            <div className="divider"></div>
            <div><div className="badge">Keystore Module</div> {formatHex(safe.modules[0])}</div>
            <div><div className="badge">Keystore Contract</div> {formatHex(safe.keystoreAddr)}</div>
            <div><div className="badge">Keystore Key</div> {formatHex(safe.keyspaceKey)}</div>
            <div><div className="badge">Keystore Value</div> {formatHex(safe.keyspaceValue)}</div>
            <div><div className="badge">Keystore Key Nonce</div> {safe.keyspaceKeyNonce}</div>
            <div><div className="badge">Keystore root</div> {formatBigInt(safe.keystoreRoot)}</div>
        </div>
        <SendAsset network={network} safe={safe} />
    </div>

}

function ViewSafePage(
    {
        safe
    }: {
        safe: MultiNetworkSafeInfo,
    }) {
    const signer = useEthersSigner()

    return <main className="flex flex-col">
        <div className="grid grid-cols-2 gap-4">
            {["op_sepolia", "base_sepolia"]
                .map(network => <SafePanel network={network} safe={safe?.safes[network]} />)}
        </div>
        <div>
            <Button
                text="Change owner"
                classes="btn-primary"
                onClick={() => {
                    const doc = document.getElementById("change_owner_modal") as HTMLDialogElement
                    doc.showModal()
                }}
            />
            <ChangeOwner safe={safe.safes["op_sepolia"]} />
        </div>
    </main >
}

export default ViewSafePage