'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      router.push(searchParams.get('redirect') || '/admin')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-card">
      <h1>GCC Startup Platform</h1>
      <p className="login-subtitle">Sign in to continue</p>
      {error && <div className="login-error">{error}</div>}
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <div className="login-page">
      <Suspense fallback={<div className="login-card">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
