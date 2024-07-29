
export enum AlertType {
    Success,
    Error
}

export interface AlertConf {
    children: React.ReactNode,
    type: AlertType
}

const getStyle = (type: AlertType): string[] => {
    switch (type) {
        case AlertType.Success:
            return ["bg-teal-100", "border-teal-400", "text-teal-700"]
        case AlertType.Error:
            return ["bg-red-100", "border-red-400", "text-red-700"]
    }
}

function Alert({
    conf,
    onClose
}: {
    conf: AlertConf
    onClose: () => void
}) {
    const [background, border, text] = getStyle(conf.type)
    return <div className={`flex flex-wrap mb-6 p-4 border py-3 rounded relative ${background}  ${border}  ${text}`}>
        <span className="block sm:inline">{conf.children}</span>
        {onClose && <span
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={onClose}>
            <svg className={`fill-current h-6 w-6 ${text}`} role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
        </span>}
    </div>
}

export default Alert