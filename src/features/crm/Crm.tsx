import { useEffect, useState } from 'react'
import './Crm.css'
import { getCurrentUser, login, logout, type AuthUser } from './auth/auth.api'
import Dashboard from './components/Dashboard'
import Login from './components/Login'

export default function Crm() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  if (checkingSession) return <main className="crm-login" aria-busy="true">Cargando sesión…</main>

  if (!user) {
    return <Login onLogin={async (email, password) => setUser(await login(email, password))} />
  }

  return <Dashboard user={user} onLogout={() => { logout(); setUser(null) }} />
}
