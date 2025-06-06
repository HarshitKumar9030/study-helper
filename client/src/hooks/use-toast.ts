import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: {
    label: string
    onClick: () => void
  }
}

export const useToast = () => {
  const toast = ({ title, description, variant = "default", action }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description,
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      })
    } else {
      sonnerToast.success(title || "Success", {
        description,
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      })
    }
  }

  return { toast }
}
