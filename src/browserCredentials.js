// Hands a freshly accepted login to the browser's password manager through the
// Credential Management API (Chrome, Edge, Android WebView). Safari and
// Firefox don't implement PasswordCredential and rely on their own form
// heuristics (a submitted form with a current-password field), which the
// login form satisfies. Best effort: never throws, never awaited.
export function storeBrowserPasswordCredential({ username, password, name = null }) {
  try {
    if (typeof window === 'undefined' || typeof window.PasswordCredential !== 'function') {
      return
    }

    if (!navigator.credentials?.store || !username || !password) {
      return
    }

    const credential = new window.PasswordCredential({
      id: username,
      password,
      name: name || username,
    })

    void navigator.credentials.store(credential).catch(() => {})
  } catch {
    // Unsupported or blocked (e.g. insecure context): nothing to do.
  }
}
