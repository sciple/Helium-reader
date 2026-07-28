export const NOTICE_EVENT = 'app:notice'

/** Show a short-lived message in the bottom-right corner. Rendered by <Notice />. */
export function notify(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(NOTICE_EVENT, { detail: message }))
}
