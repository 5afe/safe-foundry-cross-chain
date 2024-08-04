

function Button(
    {
        label,
        text,
        disabled,
        classes,
        onClick,
    }: {
        label?: string,
        text: React.ReactNode,
        disabled?: boolean,
        classes?: string,
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
            className={`btn ${classes}`}
            type="button"
            disabled={disabled}
            onClick={onClick}>
            {text}
        </button>
    </div>
}

export default Button