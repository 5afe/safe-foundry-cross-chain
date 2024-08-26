

import { Button as ButtonF, Spinner } from "flowbite-react";

function Button(
    {
        text,
        disabled,
        className,
        isLoading,
        onClick,
    }: {
        text: React.ReactNode,
        disabled?: boolean,
        isLoading?: boolean,
        className?: string,
        onClick?: () => void,
    }) {
    return <div className="flex flex-wrap">
        <ButtonF.Group outline>
            <ButtonF
                className={className}
                color="blue"
                disabled={isLoading || disabled}
                onClick={onClick}>
                {isLoading && <Spinner color="info" className="mr-3 h-4 w-4" />}
                {text}
            </ButtonF>
        </ButtonF.Group>
    </div>
}

export default Button