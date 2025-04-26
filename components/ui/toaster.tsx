"use client"

import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

export function Toaster() {
  const { toasts } = useToast()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col items-end p-4 space-y-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-white shadow-lg rounded-lg p-4 max-w-sm transform transition-all duration-300 ease-in-out ${
            toast.variant === "destructive" ? "border-l-4 border-red-500" : "border-l-4 border-green-500"
          }`}
        >
          <div className="flex flex-col">
            <div className="font-medium">{toast.title}</div>
            {toast.description && <div className="text-sm text-gray-500">{toast.description}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
