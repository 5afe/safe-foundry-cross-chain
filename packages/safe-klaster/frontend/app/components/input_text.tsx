import { Label, TextInput } from "flowbite-react";


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
    return (
        <div className="max-w-md">
            <div className="mb-2 block">
                <Label htmlFor={label} value={label} />
            </div>
            <TextInput
                id={label}
                type="text"
                placeholder={placeholder}
                color={field.hasError ? "failure" : "gray"}
                value={field.value}
                disabled={field.disabled}
                onChange={onChange}
                helperText={
                    field.message &&
                    <div className="label">
                        <span className={`label-text-alt text-gray-600 text-xs ${(field.hasError && "text-red-500")}`}>
                            {field.message}
                        </span>
                    </div>
                }
            />
        </div>)
}

export default InputText