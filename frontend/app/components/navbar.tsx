import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

function NavBar() {
    return <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between mx-auto p-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <img
                    src="https://avatars.githubusercontent.com/u/102983781?s=280&v=4"
                    className="h-8" />
                <span className="text-2xl whitespace-nowrap block uppercase tracking-wide text-gray-700 font-bold">
                    Safe • Scroll
                </span>
                <img
                    src=" https://safe-transaction-assets.staging.5afe.dev/chains/534352/chain_logo.png"
                    className="h-8" />
                <span className="text-2xl whitespace-nowrap block tracking-wide text-gray-700 font-bold">
                    Keystore demo
                </span>
            </div>
            <div className="hidden w-full md:block md:w-auto" id="navbar-default">
                <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                    <li>
                        <ConnectButton />
                    </li>
                </ul>
            </div>
        </div>
    </nav>
}

export default NavBar
