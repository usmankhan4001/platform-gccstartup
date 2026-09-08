export function ToastMessage({ message, type }: { message: string; type?: string }) { return <div className={["rounded-md px-4 py-2 text-sm text-white shadow-lg", type === "error" ? "bg-[var(--danger)]" : type === "success" ? "bg-[var(--success)]" : "bg-primary"].join(" ")}>{message}</div> }

export { useToast } from './ToastProvider'
