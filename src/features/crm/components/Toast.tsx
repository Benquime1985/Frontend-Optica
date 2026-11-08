export default function Toast({ message }: { message: string }) {
  if (!message) return null
  return <p className="crm-toast" role="status" aria-live="polite">{message}</p>
}
