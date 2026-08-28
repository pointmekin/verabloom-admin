import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Toast as ToastPrimitive } from 'radix-ui'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

import { cn } from '#/lib/utils'

type ToastKind = 'success' | 'error'
type ToastInput = { title: string; description?: string; kind?: ToastKind }
type ToastItem = ToastInput & { id: number }

type ToastContextValue = { toast: (input: ToastInput) => void }
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random()
      setItems((current) => [...current.slice(-2), { ...input, id }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2 outline-none" />
        {items.map((item) => {
          const isError = item.kind === 'error'
          return (
            <ToastPrimitive.Root
              key={item.id}
              open
              onOpenChange={(open) => !open && dismiss(item.id)}
              className={cn(
                'grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-lg',
                isError
                  ? 'border-destructive/40'
                  : 'border-[var(--success)]/40',
              )}
            >
              {isError ? (
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 text-destructive"
                  size={18}
                />
              ) : (
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 text-[var(--success)]"
                  size={18}
                />
              )}
              <div className="grid gap-1">
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description ? (
                  <ToastPrimitive.Description className="text-xs text-muted-foreground">
                    {item.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss notification"
                className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X aria-hidden="true" size={16} />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
