import { useState } from "react"
import InputText, { InputField } from "./form/input_text"
import { AddressLike, JsonRpcSigner, ethers, getBytes, isAddress, parseEther, toBigInt } from "ethers"
import { formatAddr, isFloat, isInt, useEthersSigner } from "../utils/utils"
import Button from "./form/button"
import { SafeInfo } from "../utils/interfaces"
import config from "../utils/config"
import SafeKeystoreModuleABI from "../utils/abi/safekeystoremodule.abi.json"
import { BigNumberish } from "ethers"
import { BytesLike } from "ethers"
import Alert, { AlertConf, AlertType } from "./alert"

const RECIPIENT_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }
const AMOUNT_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }

const signTransaction = async ({
    signer,
    safeAddress,
    to,
    value,
    data,
    keystore,
    onSuccess,
    onError
}: {
    signer?: JsonRpcSigner,
    safeAddress: AddressLike,
    to: AddressLike,
    value: BigNumberish
    data: BytesLike,
    keystore?: SafeInfo,
    onSuccess: (result: any) => Promise<void>,
    onError: (error: any) => Promise<void>
}): Promise<void> => {
    try {
        if (!signer) {
            throw new Error('You need to connect your Signer wallet');
        }

        if (!keystore || !keystore.owners.includes(signer.address)) {
            throw new Error(`Invalid Signer wallet ${formatAddr(signer.address)}`);
        }

        const operation = 0 // CALL
        console.log(`===> signTransaction`)
        const safeKeystoreModuleContract = new ethers.Contract(config.l2.singletons.safe_keystore_module, SafeKeystoreModuleABI, signer);

        const msg = await safeKeystoreModuleContract.getTxHash(safeAddress, to, value, data, operation)
        console.log(`===> msg to sign = ${msg}`)

        const signature = await signer.signMessage(getBytes(msg))
        console.log(`===> signature = ${signature}`)

        await onSuccess({ msg, signature })
    } catch (error: any) {
        await onError(error.message)
    }
}

const submitTransaction = async ({
    signer,
    safeAddress,
    to,
    value,
    data,
    signature,
    keystore,
    onSuccess,
    onError
}: {
    signer?: JsonRpcSigner,
    safeAddress: AddressLike,
    to: AddressLike,
    value: BigNumberish
    data: BytesLike,
    signature: BytesLike,
    keystore?: SafeInfo,
    onSuccess: (result: any) => Promise<void>,
    onError: (error: any) => Promise<void>
}): Promise<void> => {
    try {
        if (!signer) {
            throw new Error('You need to connect your Signer wallet');
        }
        if (!keystore || !keystore.owners.includes(signer.address)) {
            throw new Error(`Invalid Signer wallet ${formatAddr(signer.address)}`);
        }

        const operation = 0 // CALL

        const safeKeystoreModuleContract = new ethers.Contract(config.l2.singletons.safe_keystore_module, SafeKeystoreModuleABI, signer);

        console.log(`===> executeTransaction(` +
            `safeAddress=${safeAddress}, ` +
            `to=${to}, ` +
            `value=${value}, ` +
            `data=${data}, ` +
            `operation=${operation}, ` +
            `signature=${signature})`
        )
        const tx = await safeKeystoreModuleContract.executeTransaction(
            safeAddress,
            to,
            value,
            data,
            operation,
            signature,
            {
                gasLimit: "1000000", //bypass gas estimation (cause' it always fails)
            }
        )

        await onSuccess({ hash: tx.hash })
    } catch (error: any) {
        if(error.shortMessage === "missing r") { // some weird error we don't care...
            await onSuccess({ hash: error.value.hash })
            return;
        }
        await onError(error.message)
    }
}

function Payment({ safe, keystore }: { safe?: SafeInfo, keystore?: SafeInfo }) {
    const signer = useEthersSigner()

    const [recipientField, setRecipientField] = useState<InputField>(RECIPIENT_FIELD_INIT)
    const [amountField, setAmountField] = useState<InputField>(AMOUNT_FIELD_INIT)
    const [alert, setAlert] = useState<AlertConf>()

    return <main className="flex flex-col items-center justify-between pt-8">
        <form className="bg-white shadow-md rounded w-[600px] px-6 pt-6">
            <div className="flex flex-wrap">
                <div className="block uppercase tracking-wide text-gray-700 text-s font-bold mb-2">
                    Payment form
                </div>
                <div className="w-full md:mb-0">
                    <InputText
                        label="Recipient"
                        placeholder="0x..."
                        field={recipientField}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const recipient = e.currentTarget.value
                            if (recipient == "") {
                                setRecipientField(RECIPIENT_FIELD_INIT)
                                return;
                            }

                            if (!isAddress(recipient)) {
                                setRecipientField({ value: recipient, hasError: true, message: "Invalid Address" })
                                return;
                            }

                            // Valid address
                            setRecipientField({ value: recipient, hasError: false, message: "" })
                        }} />
                </div>
                <div className="w-full md:mb-0">
                    <InputText
                        label="Amount (ETH)"
                        placeholder="0.015"
                        field={amountField}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const amount = e.currentTarget.value
                            if (amount == "") {
                                setAmountField(AMOUNT_FIELD_INIT)
                                return;
                            }

                            if ((!isInt(amount) && !isFloat(amount)) || parseFloat(amount) <= 0) {
                                setAmountField({ value: amount, hasError: true, message: "Invalid amount" })
                                return;
                            }

                            if (parseEther(amount) > toBigInt(safe?.balance || 0)) {
                                setAmountField({ value: amount, hasError: true, message: "Amount exceeds total balance" })
                                return;
                            }

                            // Valid amount
                            setAmountField({ value: amount, hasError: false, message: "" })
                        }} />
                </div>
                <div className="w-full md:w-1/4 flex flex-row space-x-2 mt-[-24px]">
                    <Button
                        text="Sign transaction"
                        disabled={
                            !safe
                            || !keystore
                            || !amountField.value
                            || amountField.hasError
                            || !recipientField.value
                            || recipientField.hasError}
                        onClick={() => {
                            if (!safe) {
                                return;
                            }
                            setAlert(undefined)
                            signTransaction({
                                signer,
                                safeAddress: safe.address,
                                to: recipientField.value,
                                value: parseEther(amountField.value),
                                data: "0x",
                                keystore,
                                onSuccess: async (result) => {
                                    console.log(`signTransaction::success`)
                                    console.log(result)
                                    setAlert({
                                        children: <div>
                                            <div>{`Succesfully signed message ${formatAddr(signer?.address || "")}`}</div>
                                            <div>Signature: <code>{result.signature}</code></div>
                                            <Button
                                                text="Relay transaction"
                                                disabled={false}
                                                onClick={() => {
                                                    submitTransaction({
                                                        signer,
                                                        safeAddress: safe.address,
                                                        to: recipientField.value,
                                                        value: parseEther(amountField.value),
                                                        data: "0x",
                                                        signature: result.signature,
                                                        keystore,
                                                        onSuccess: async (result) => {
                                                            console.log(`submitTransaction::success`)
                                                            console.log(result)
                                                            setAlert({
                                                                children: <div>
                                                                    <div>{`Succesfully relayed transaction`}</div>
                                                                    <div>Hash: <code>{result.hash}</code></div>
                                                                </div>,
                                                                type: AlertType.Success
                                                            })
                                                        },
                                                        onError: async (error) => {
                                                            console.error(`submitTransaction::error`)
                                                            console.error(error)
                                                            setAlert({
                                                                children: <span>{error}</span>,
                                                                type: AlertType.Error
                                                            })
                                                        }
                                                    })
                                                }}
                                            />
                                        </div>,
                                        type: AlertType.Success
                                    })
                                },
                                onError: async (error) => {
                                    console.error(`signTransaction::error`)
                                    console.error(error)
                                    setAlert({
                                        children: <span>{error}</span>,
                                        type: AlertType.Error
                                    })
                                }
                            })
                        }}
                    />
                    <button
                        type="button"
                        className="text-sm font-semibold leading-6 text-gray-900"
                        onClick={
                            () => {
                                setRecipientField(RECIPIENT_FIELD_INIT)
                                setAmountField(AMOUNT_FIELD_INIT)
                                setAlert(undefined)
                            }
                        }
                    >
                        Reset
                    </button>
                </div>
            </div>
            {alert &&
                <Alert
                    conf={alert}
                    onClose={() => setAlert(undefined)}
                />
            }
        </form>
    </main >
}

export default Payment