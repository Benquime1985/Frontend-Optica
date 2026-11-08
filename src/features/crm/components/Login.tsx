import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../../../components/BrandLogo'

export default function Login({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <main className="crm-login">
      <section className="login-card">
        <Link className="crm-brand" to="/"><BrandLogo className="crm-brand" suffix="CRM" /></Link>
        <div className="login-copy">
          <p className="crm-eyebrow">Bienvenido de nuevo</p>
          <h1>
            El corazón de
            <br />
            <em>tu óptica.</em>
          </h1>
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            setLoading(true)
            try {
              await onLogin(email, password)
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesión.')
            } finally {
              setLoading(false)
            }
          }}
        >
          <label>
            Correo
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="crm-primary-button" type="submit" disabled={loading}>
            {loading ? 'Validando…' : 'Entrar al CRM →'}
          </button>
        </form>
      </section>
    </main>
  )
}
