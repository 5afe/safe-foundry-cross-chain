

export interface InputField {
    value: string;
    hasError?: boolean;
    message?: React.ReactNode;
    disabled?: boolean
}

function InputText(
    {
        label,
        placeholder,
        field,
        classes,
        button,
        onChange,
    }: {
        label?: string,
        placeholder?: string,
        field: InputField,
        classes?: string,
        button?: { label: React.ReactNode, onClick: () => void, disabled?: boolean }
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
    }) {
    return <label className="form-control w-full max-w-xs ">
        <div className="label">
            <span className="label-text">{label ? label : " "}</span>
        </div>
        <div className="w-full">
            <div className="join w-full">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={field.value}
                    disabled={field.disabled}
                    onChange={onChange}
                    className={`${classes} ${field.hasError ? "input-error" : ""} ${button ? "join-item" : ""} input input-bordered w-full max-w-xs `} />

                {button &&
                    <button
                        type="button"
                        className="btn join-item rounded-r-full"
                        onClick={() => button.onClick()}
                        disabled={button.disabled}>
                        {button.label}
                    </button>}
            </div>
        </div>
        {field.message &&
            <div className="label">
                <span className={`label-text-alt text-gray-600 text-xs ${(field.hasError && "text-red-500")}`}>
                    {field.message}
                </span>
            </div>
        }
    </label>
}

export default InputText