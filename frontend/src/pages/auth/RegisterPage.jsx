import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import FormField from '../../components/FormField'
import { register as registerAccount } from '../../services/authService'
import {
  createOrganizationSchema,
  joinOrganizationSchema,
} from '../../schemas/authSchemas'
import { getApiErrorMessage } from '../../utils/apiError'

function RegisterPage() {
  const [registrationMode, setRegistrationMode] = useState('create')
  const navigate = useNavigate()
  const schema =
    registrationMode === 'create'
      ? createOrganizationSchema
      : joinOrganizationSchema
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    shouldUnregister: true,
    defaultValues: {
      email: '',
      full_name: '',
      password: '',
      confirm_password: '',
      organization_name: '',
      invitation_token: '',
    },
  })

  async function onSubmit(values) {
    const registration = {
      email: values.email,
      full_name: values.full_name,
      password: values.password,
      ...(registrationMode === 'create'
        ? { organization_name: values.organization_name }
        : { invitation_token: values.invitation_token }),
    }

    try {
      await registerAccount(registration)
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Sign in to continue.' },
      })
    } catch (error) {
      setError('root.server', {
        message: getApiErrorMessage(error, 'Unable to create your account. Please try again.'),
      })
    }
  }

  function chooseMode(mode) {
    setRegistrationMode(mode)
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
        Get started
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">Create your account</h2>
      <p className="mt-2 text-sm leading-6 text-stockflow-ink/65">
        Create a new organization or join one with an invitation.
      </p>

      <div className="mt-5 grid grid-cols-2 rounded-lg bg-stockflow-gray/35 p-1">
        <button
          aria-pressed={registrationMode === 'create'}
          className={`min-h-10 rounded-md px-2 text-sm font-medium transition ${
            registrationMode === 'create'
              ? 'bg-white text-stockflow-ink shadow-sm'
              : 'text-stockflow-ink/65 hover:text-stockflow-ink'
          }`}
          onClick={() => chooseMode('create')}
          type="button"
        >
          Create organization
        </button>
        <button
          aria-pressed={registrationMode === 'join'}
          className={`min-h-10 rounded-md px-2 text-sm font-medium transition ${
            registrationMode === 'join'
              ? 'bg-white text-stockflow-ink shadow-sm'
              : 'text-stockflow-ink/65 hover:text-stockflow-ink'
          }`}
          onClick={() => chooseMode('join')}
          type="button"
        >
          Join organization
        </button>
      </div>

      {errors.root?.server && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errors.root.server.message}
        </div>
      )}

      <form className="mt-5 space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          autoComplete="name"
          error={errors.full_name?.message}
          id="full_name"
          label="Full name"
          placeholder="Alex Morgan"
          {...register('full_name')}
        />
        <FormField
          autoComplete="email"
          error={errors.email?.message}
          id="register_email"
          label="Email"
          placeholder="you@company.com"
          type="email"
          {...register('email')}
        />
        {registrationMode === 'create' ? (
          <FormField
            autoComplete="organization"
            error={errors.organization_name?.message}
            id="organization_name"
            label="Organization name"
            placeholder="My Store"
            {...register('organization_name')}
          />
        ) : (
          <FormField
            autoCapitalize="none"
            autoComplete="off"
            error={errors.invitation_token?.message}
            id="invitation_token"
            label="Invitation token"
            placeholder="Paste your invitation token"
            spellCheck={false}
            {...register('invitation_token')}
          />
        )}
        <FormField
          autoComplete="new-password"
          error={errors.password?.message}
          id="register_password"
          label="Password"
          type="password"
          {...register('password')}
        />
        <FormField
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          id="confirm_password"
          label="Confirm password"
          type="password"
          {...register('confirm_password')}
        />
        <button
          className="min-h-11 w-full rounded-lg bg-stockflow-slate px-4 py-2 font-semibold text-white transition hover:bg-stockflow-slate/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-stockflow-ink/70">
        Already have an account?{' '}
        <Link className="font-semibold text-stockflow-slate underline-offset-4 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
