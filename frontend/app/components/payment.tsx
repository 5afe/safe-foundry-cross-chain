import { useState } from "react"
import InputText, { InputField } from "./form/input_text"
import { AddressLike, JsonRpcSigner, ethers, getBytes, isAddress, parseEther, toBigInt } from "ethers"
import { isFloat, isInt, useEthersSigner } from "../utils/utils"
import Button from "./form/button"
import { SafeInfo } from "../utils/interfaces"
import config from "../utils/config"
import SafeKeystoreModuleABI from "../utils/abi/safekeystoremodule.abi.json"
import { BigNumberish } from "ethers"
import { BytesLike } from "ethers"

const RECIPIENT_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }
const AMOUNT_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }

const performPayment = async ({
    signer,
    safeAddress,
    keystore,
    to,
    value,
    data,
    onSuccess,
    onError
}: {
    signer: JsonRpcSigner,
    safeAddress: AddressLike,
    keystore?: SafeInfo,
    to: AddressLike,
    value: BigNumberish
    data: BytesLike,
    onSuccess: (result: any) => Promise<void>,
    onError: (error: any) => Promise<void>
}): Promise<void> => {
    try {
        const operation = 0 // CALL
        console.log(`===> performPayment`)
        const safeKeystoreModuleContract = new ethers.Contract(config.safe_keystore_module, SafeKeystoreModuleABI, signer);

        const msg = await safeKeystoreModuleContract.getTxHash(safeAddress, to, value, data, operation)
        console.log(`===> msg to sign = ${msg}`)

        const signature = await signer.signMessage(getBytes(msg))
        console.log(`===> signature = ${signature}`)

        const tx = await safeKeystoreModuleContract.executeTransaction(
            safeAddress,
            to,
            value,
            data,
            operation,
            signature
        )

        console.log(`===> signature = ${JSON.stringify(tx)}`)
        await tx.wait()

        await onSuccess({hash: tx.hash})
    } catch (error: any) {
        await onError(error.message)
    }
}

function Payment({ safe, keystore }: { safe?: SafeInfo, keystore?: SafeInfo }) {
    const signer = useEthersSigner()

    const [recipientField, setRecipientField] = useState<InputField>(RECIPIENT_FIELD_INIT)
    const [amountField, setAmountField] = useState<InputField>(AMOUNT_FIELD_INIT)

    return <main className="flex min-h-screen flex-col items-center justify-between p-8">
        <form className="bg-white shadow-md rounded w-[600px] px-8 pt-6">
            <div className="flex flex-wrap -mx-3">
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
                <div className="w-full md:w-1/4 ">
                    <Button
                        text="Submit"
                        disabled={
                            !safe
                            || !keystore
                            || !amountField.value
                            || amountField.hasError
                            || !recipientField.value
                            || recipientField.hasError}
                        onClick={() => {
                            if (!safe || !signer) {
                                return;
                            }
                            performPayment({
                                signer,
                                safeAddress: safe?.address,
                                keystore,
                                to: recipientField.value,
                                value: parseEther(amountField.value),
                                data: "0x",
                                onSuccess: async (result) => {
                                    console.log(`success::${JSON.stringify(result)}`)
                                },
                                onError: async (error) => {
                                    console.log(`error::${JSON.stringify(error)}`)
                                }
                            })
                        }}
                    />
                </div>
            </div>
        </form>
    </main >
}

export default Payment