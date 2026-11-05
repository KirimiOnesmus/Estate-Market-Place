import { useEffect } from 'react'
import { FiCheckCircle } from 'react-icons/fi'

export function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(onDismiss, 3200)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])
  return <div className="toast" role="status" aria-live="polite" data-visible={Boolean(message)}><FiCheckCircle size={16} /><span>{message}</span></div>
}
