import * as React from "react"

export function useToast() {
    const [toasts, setToasts] = React.useState([])

    const toast = React.useCallback(({ title, description, variant = "default" }) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts((prev) => [...prev, { id, title, description, variant }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    return { toast, toasts }
}
