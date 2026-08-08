import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import BookWorkspace from './pages/BookWorkspace.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import { supabase, supabaseConfigured } from './supabaseClient.js'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen">
      {!supabaseConfigured && (
        <div className="bg-blood-700 text-ink-950 font-ui text-sm text-center py-2 px-4">
          Supabase isn't connected yet — see SETUP_GUIDE.md to add your project URL and key.
        </div>
      )}

      {session === undefined ? (
        <div className="min-h-screen flex items-center justify-center font-ui text-ink-600">Loading...</div>
      ) : !session ? (
        <AuthScreen />
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/book/:id" element={<BookWorkspace />} />
        </Routes>
      )}
    </div>
  )
}
