import { useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message)
      } else if (data?.session) {
        // Email confirmation is off — they're logged in immediately.
      } else {
        setMessage('Account created. Check your email to confirm, then log in below.')
        setMode('login')
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(signInError.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card p-8 w-full max-w-sm">
        <h1 className="font-serif text-3xl text-gilt-300 mb-1 text-center">Inkwell</h1>
        <p className="font-ui text-xs text-ink-600 opacity-70 text-center mb-6">
          {mode === 'login' ? 'Welcome back.' : 'Your own private shelf.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="font-ui text-xs text-blood-400">{error}</p>}
          {message && <p className="font-ui text-xs text-gilt-400">{message}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full font-ui text-sm px-4 py-2.5 rounded-lg disabled:opacity-50">
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
          className="font-ui text-xs text-gilt-400 opacity-80 hover:opacity-100 mt-5 w-full text-center"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
