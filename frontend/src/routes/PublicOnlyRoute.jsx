import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-stockflow-cream px-4 text-stockflow-ink">
        <p aria-live="polite">Restoring your session…</p>
      </main>
    )
  }

  if (status === 'authenticated') {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet />
}

export default PublicOnlyRoute
