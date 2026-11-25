import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MailPlus, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import FormField from '../components/FormField'
import {
  organizationInvitationSchema,
  organizationSettingsSchema,
} from '../schemas/organizationSchemas'
import {
  createOrganizationInvitation,
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../services/organizationService'
import { getApiErrorMessage } from '../utils/apiError'
import { formatDateTime } from '../utils/formatters'

function OrganizationPage() {
  const queryClient = useQueryClient()
  const [settingsNotice, setSettingsNotice] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [invitationResponse, setInvitationResponse] = useState(null)
  const [invitationError, setInvitationError] = useState('')
  const settingsQuery = useQuery({
    queryKey: ['organization', 'settings'],
    queryFn: getOrganizationSettings,
  })
  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    reset: resetSettings,
    formState: { errors: settingsFieldErrors, isSubmitting: isSavingSettings },
  } = useForm({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: { default_low_stock_threshold: '' },
  })
  const {
    register: registerInvitation,
    handleSubmit: handleInvitationSubmit,
    reset: resetInvitation,
    formState: { errors: invitationFieldErrors, isSubmitting: isSubmittingInvitation },
  } = useForm({
    resolver: zodResolver(organizationInvitationSchema),
    defaultValues: { email: '' },
  })
  const settingsMutation = useMutation({
    mutationFn: updateOrganizationSettings,
  })
  const invitationMutation = useMutation({
    mutationFn: createOrganizationInvitation,
  })

  useEffect(() => {
    if (settingsQuery.data) {
      resetSettings({
        default_low_stock_threshold: String(
          settingsQuery.data.default_low_stock_threshold,
        ),
      })
    }
  }, [settingsQuery.data, resetSettings])

  async function saveSettings(values) {
    setSettingsNotice('')
    setSettingsError('')
    try {
      const updatedSettings = await settingsMutation.mutateAsync(values)
      queryClient.setQueryData(['organization', 'settings'], updatedSettings)
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      setSettingsNotice('Organization settings saved.')
    } catch (error) {
      setSettingsError(
        getApiErrorMessage(error, 'Unable to save organization settings.'),
      )
    }
  }

  async function sendInvitation(values) {
    setInvitationResponse(null)
    setInvitationError('')
    try {
      const response = await invitationMutation.mutateAsync(values)
      setInvitationResponse(response)
      resetInvitation({ email: '' })
    } catch (error) {
      setInvitationError(
        getApiErrorMessage(error, 'Unable to create the invitation.'),
      )
    }
  }

  return (
    <div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
          Organization
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings & team</h1>
        <p className="mt-2 text-sm leading-6 text-stockflow-ink/65">
          Manage your organization&apos;s inventory defaults and invite staff.
        </p>
      </div>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-stockflow-cream text-stockflow-slate">
              <Building2 aria-hidden="true" size={22} />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Organization settings</h2>
              <p className="text-sm text-stockflow-ink/60">Set your default inventory threshold.</p>
            </div>
          </div>

          {settingsQuery.isPending ? (
            <div aria-busy="true" className="mt-6 h-32 animate-pulse rounded-xl bg-stockflow-cream" />
          ) : settingsQuery.isError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
              <p className="text-sm text-red-800">
                {getApiErrorMessage(settingsQuery.error, 'Could not load organization settings.')}
              </p>
              <button
                className="mt-3 text-sm font-semibold text-stockflow-slate underline"
                onClick={() => settingsQuery.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {settingsNotice && (
                <p className="mt-5 text-sm text-green-800" role="status">{settingsNotice}</p>
              )}
              {settingsError && (
                <p className="mt-5 text-sm text-red-800" role="alert">{settingsError}</p>
              )}
              <dl className="mt-6 rounded-xl bg-stockflow-cream/65 p-4">
                <dt className="text-sm text-stockflow-ink/60">Organization name</dt>
                <dd className="mt-1 font-semibold">{settingsQuery.data.name}</dd>
              </dl>
              <form className="mt-5 space-y-4" onSubmit={handleSettingsSubmit(saveSettings)}>
                <FormField
                  error={settingsFieldErrors.default_low_stock_threshold?.message}
                  id="default_low_stock_threshold"
                  label="Default low-stock threshold"
                  min="0"
                  step="1"
                  type="number"
                  {...registerSettings('default_low_stock_threshold')}
                />
                <p className="text-sm leading-6 text-stockflow-ink/60">
                  Products without their own threshold use this value.
                </p>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-stockflow-slate px-4 font-semibold text-white transition hover:bg-stockflow-slate/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSavingSettings || settingsMutation.isPending}
                  type="submit"
                >
                  Save settings
                </button>
              </form>
            </>
          )}
        </section>

        <section
          className="rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-7"
          id="invitations"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-stockflow-cream text-stockflow-slate">
              <MailPlus aria-hidden="true" size={22} />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Invite a staff member</h2>
              <p className="text-sm text-stockflow-ink/60">Create an invitation for your organization.</p>
            </div>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleInvitationSubmit(sendInvitation)}
          >
            <FormField
              autoComplete="email"
              error={invitationFieldErrors.email?.message}
              id="invitation_email"
              label="Staff email"
              placeholder="teammate@company.com"
              type="email"
              {...registerInvitation('email')}
            />
            {invitationError && (
              <p className="text-sm text-red-800" role="alert">{invitationError}</p>
            )}
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-stockflow-slate px-4 font-semibold text-white transition hover:bg-stockflow-slate/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmittingInvitation || invitationMutation.isPending}
              type="submit"
            >
              <MailPlus aria-hidden="true" size={17} />
              Create invitation
            </button>
          </form>

          {invitationResponse && (
            <div className="mt-6 rounded-xl border border-stockflow-slate/30 bg-stockflow-cream/70 p-4" role="status">
              <div className="flex items-start gap-3">
                <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-stockflow-slate" size={20} />
                <div className="min-w-0">
                  <h3 className="font-semibold">Invitation created</h3>
                  <p className="mt-1 text-sm leading-6 text-stockflow-ink/70">
                    Share this token privately. It expires {formatDateTime(invitationResponse.expires_at)}.
                  </p>
                  <code className="mt-3 block break-all rounded-lg border border-stockflow-gray/70 bg-white px-3 py-2 text-sm">
                    {invitationResponse.invitation_token}
                  </code>
                  <p className="mt-2 text-xs text-stockflow-ink/55">
                    The invitation token is shown only in this page session.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default OrganizationPage
