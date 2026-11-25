import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import { useAuth } from '../../context/AuthContext'
import { loginSchema } from '../../schemas/authSchemas'
import { getApiErrorMessage } from '../../utils/apiError'

function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const notice = location.state?.message
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values) {
    try {
      await login(values)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (error) {
      setError('root.server', {
        message: getApiErrorMessage(error, 'Unable to sign in. Please try again.'),
      })
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
        Welcome back
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h2>
      <p className="mt-2 text-sm leading-6 text-stockflow-ink/65">
        Sign in to manage your organization&apos;s inventory.
      </p>

      {notice && (
        <div className="mt-5 rounded-lg border border-stockflow-slate/30 bg-stockflow-cream px-4 py-3 text-sm">
          {notice}
        </div>
      )}
      {errors.root?.server && (
        <div className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errors.root.server.message}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          autoComplete="email"
          error={errors.email?.message}
          id="email"
          label="Email"
          placeholder="you@company.com"
          type="email"
          {...register('email')}
        />
        <FormField
          autoComplete="current-password"
          error={errors.password?.message}
          id="password"
          label="Password"
          type="password"
          {...register('password')}
        />
        <button
          className="min-h-11 w-full rounded-lg bg-stockflow-slate px-4 py-2 font-semibold text-white transition hover:bg-stockflow-slate/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stockflow-ink/70">
        New to StockFlow?{' '}
        <Link className="font-semibold text-stockflow-slate underline-offset-4 hover:underline" to="/register">
          Create an account
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
