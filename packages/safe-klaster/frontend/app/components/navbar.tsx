
import { ConnectButton } from '@rainbow-me/rainbowkit'

function NavBar() {
    return (
        <header className="antialiased">
            <nav className="bg-white border-gray-200 dark:bg-gray-900 md:px-auto">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <img
                            src="https://avatars.githubusercontent.com/u/102983781?s=280&v=4"
                            className="h-8" />
                        <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                            Safe x Klaster
                        </span>
                    </div>
                    <div className="hidden w-full md:block md:w-auto" id="navbar-default">
                    <ConnectButton  />
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default NavBar
