

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
        onChange,
    }: {
        label?: string,
        placeholder?: string,
        field: InputField,
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
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

        <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2 disabled:bg-slate-200 
                        ${(field.hasError && "border-red-500")}`}
            type="text"
            placeholder={placeholder}
            value={field.value}
            disabled={field.disabled}
            onChange={onChange} />
        {field.message &&
            <p className={`text-gray-600 text-xs ${(field.hasError && "text-red-500")}`}>
                {field.message}
            </p>}

    </div>
}

export default InputText