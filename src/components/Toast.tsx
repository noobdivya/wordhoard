import { useToastMessage } from '../lib/toast'

export function Toast() {
  const message = useToastMessage()
  return (
    <div className="toast" role="status" hidden={!message}>
      {message}
    </div>
  )
}
