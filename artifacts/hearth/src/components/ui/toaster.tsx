import { ToastProvider, ToastViewport } from "./toast"
import { useToast } from "./use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as BaseToastProvider,
  ToastTitle,
  ToastViewport as BaseToastViewport,
} from "./toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <BaseToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <BaseToastViewport />
    </BaseToastProvider>
  )
}
