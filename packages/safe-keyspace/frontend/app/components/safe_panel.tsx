import { useContext, useState } from "react"
import InputText, { InputField } from "./form/input_text"
import { makeSafeDescription, useEthersSigner } from "../utils/utils"
import { SafeInfo } from "../utils/interfaces"
import SafeCoreProvider from "../utils/safe_core_provider"
import { FaSync } from "react-icons/fa";
import Alert, { AlertConf, AlertType } from "./alert"
import { Address, formatEther, getAddress, isAddress } from "viem"
import { readSafe } from "../utils/safe"

const SAFE_ADDR_FIELD_INIT = { value: "", message: "", hasError: false, disabled: false }

const fetchSafeInfo = async (
    {
        safeAddress,
        onSuccess,
        onError
    }: {
        safeAddress: string,
        onSuccess: (safe: SafeInfo) => Promise<void>,
        onError: (error: any) => Promise<void>
    }): Promise<void> => {
    try {
        const safeInfo = await readSafe(getAddress(safeAddress))
        onSuccess(safeInfo)
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
        setAlert
    }: {
        safeAddress: string
        setSafe: (safe?: SafeInfo) => void,
        setSafeAddrField: (inputField: InputField) => void,
        setAlert: (conf?: AlertConf) => void
    }
) => {
    setSafeAddrField({ value: safeAddress, hasError: false, message: "Loading..." })
    setAlert(undefined)

    await fetchSafeInfo({
        safeAddress,
        onSuccess: async (safe) => {
            console.log(`---> safe=${safe}`)
            console.log(safe)
            setSafe(safe)
            setSafeAddrField({ value: safeAddress, hasError: false, message: makeSafeDescription(safe) })
        },
        onError: async (error) => {
            setSafeAddrField({ value: safeAddress, hasError: true, message: error })
            setSafe(undefined)
        }
    })
}

function SafePanel(
    {
        safe,
        setSafe,
    }: {
        safe?: SafeInfo,
        setSafe: (safe?: SafeInfo) => void,
    }) {
    const signer = useEthersSigner()

    const [safeAddrField, setSafeAddrField] = useState<InputField>(SAFE_ADDR_FIELD_INIT)
    const [alert, setAlert] = useState<AlertConf>()

    return <main className="flex flex-col items-center justify-between pt-8">
        <form className="bg-white shadow-md rounded w-[600px] px-6 pt-6">
            {/** MAIN SAFE SECTION */}
            <div className="flex flex-wrap">
                <div className="flex flex-row space-x-2 fleblock uppercase tracking-wide text-gray-700 text-s font-bold mb-2">
                    <span>Safe</span>
                    <FaSync
                        className="mt-1 cursor-pointer"
                        onClick={() => {
                            console.log("refresh...") //TODO::Implement refresh job
                        }} />
                </div>
                <div className="w-full md:w-3/4 md:mb-0">
                    <InputText
                        label="Your Safe"
                        placeholder="0x..."
                        field={safeAddrField}
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
                                setSafeAddrField,
                                setAlert
                            })
                        }} />
                </div>
                <div className="w-full md:w-1/4 px-3">
                    <InputText
                        field={{ value: `${safe ? formatEther(safe.balance) : 0} ETH`, disabled: true }}
                    />
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

export default SafePanel