import { useState } from "react"
import InputText, { InputField } from "./form/input_text"
import { MultiNetworkSafeInfo, SafeInfo } from "../utils/interfaces"
import { getAddress, isAddress } from "viem"
import { readSafe } from "../utils/safe"
import Button from "./form/button"
import { IoSendSharp } from "react-icons/io5";
import config from "../utils/config"


const SAFE_ADDR_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }

const fetchSafeInfo = async (
    {
        safeAddress,
        onSuccess,
        onError
    }: {
        safeAddress: string,
        onSuccess: (multiNetworkSafeInfo: MultiNetworkSafeInfo) => Promise<void>,
        onError: (error: any) => Promise<void>
    }): Promise<void> => {
    try {
        const [safeOpSepolia, safeBaseSepolia] = await Promise.all([
            readSafe(config.opSepoliaClient, getAddress(safeAddress)),
            readSafe(config.baseSepoliaClient, getAddress(safeAddress))
        ])
        onSuccess({
            address: getAddress(safeAddress),
            safes: {
                op_sepolia: safeOpSepolia,
                base_sepolia: safeBaseSepolia
            }
        })
    } catch (error: any) {
        console.log(error)
        onError(error.message)
    }
}

const load = async (
    {
        safeAddress,
        setSafe,
        setSafeAddrField,
    }: {
        safeAddress: string
        setSafe: (safe?: MultiNetworkSafeInfo) => void,
        setSafeAddrField: (inputField: InputField) => void,
    }
) => {
    setSafeAddrField({ value: safeAddress, hasError: false, message: "Loading..." })

    await fetchSafeInfo({
        safeAddress,
        onSuccess: async (safe) => {
            setSafe(safe)
            setSafeAddrField({ value: safeAddress, hasError: false, message: "" })
        },
        onError: async (error) => {
            setSafeAddrField({ value: safeAddress, hasError: true, message: error })
            setSafe(undefined)
        }
    })
}

function OpenSafePage(
    {
        safe,
        setSafe,
        setActiveTab,
    }: {
        safe?: MultiNetworkSafeInfo,
        setSafe: (safe?: MultiNetworkSafeInfo) => void,
        setActiveTab: (tab: string) => void
    }) {
    const [safeAddrField, setSafeAddrField] = useState<InputField>(SAFE_ADDR_FIELD_INIT)

    return <main className="flex flex-col">
        <form>
            <div>
                <InputText
                    label="Your Safe"
                    placeholder="0x..."
                    field={safeAddrField}
                    button={{
                        label: <IoSendSharp />,
                        disabled: safeAddrField.hasError || safeAddrField.value === "",
                        onClick: () => setActiveTab("SAFE")
                    }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const address = e.currentTarget.value
                        if (address == "") {
                            setSafeAddrField(SAFE_ADDR_FIELD_INIT)
                            setSafe(undefined)
                            return;
                        }

                        if (!isAddress(address)) {
                            setSafeAddrField({ value: address, hasError: true, message: "Invalid Address" })
                            setSafe(undefined)
                            return;
                        }

                        // Valid address
                        load({
                            safeAddress: address,
                            setSafe,
                            setSafeAddrField
                        })
                    }} />
            </div>

            <div className="divider">OR</div>

            <div className="flex flex-wrap">
                <div className="w-full">
                    <Button
                        text="Create a new Safe"
                        classes="w-full"
                        onClick={() => console.log("hello")}
                    />
                </div>
            </div>

        </form>
    </main >
}

export default OpenSafePage