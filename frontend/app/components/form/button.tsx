

function Button(
    {
        label,
        text,
        disabled,
        onClick,
    }: {
        label?: string,
        text: string,
        disabled?: boolean
        onClick?: () => void,
    }) {
    return <div className="flex flex-wrap mb-6">
        <div className="w-full">
            {label ?
                <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                    {label}
                </label>
                :
                <div className="h-6"></div>}
        </div>

        <button
            className="shadow bg-blue-500 hover:bg-blue-400 focus:shadow-outline focus:outline-none text-white py-2 px-4 rounded text-xs h-[38px] disabled:bg-blue-200"
            type="button"
            disabled={disabled}
            onClick={onClick}>
            {text}
        </button>
    </div>
}

export default Button