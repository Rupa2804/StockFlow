import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../utils/apiError'

function ProtectedRoute() {
  const { status, authError, retryCurrentUser } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-stockflow-cream px-4 text-stockflow-ink">
        <p aria-live="polite">Checking your sign-in…</p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-stockflow-cream px-4 text-stockflow-ink">
        <section className="w-full max-w-md rounded-xl border border-stockflow-gray bg-white p-6">
          <h1 className="text-lg font-semibold">Could not verify your session</h1>
          <p className="mt-2 text-sm text-stockflow-ink/70">
            {getApiErrorMessage(
              authError,
              'Check your connection and try again.',
            )}
          </p>
          <button
            className="mt-4 rounded-lg bg-stockflow-slate px-4 py-2 text-sm font-semibold text-white"
            onClick={() => retryCurrentUser()}
            type="button"
          >
            Try again
          </button>
        </section>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}

export default ProtectedRoute
