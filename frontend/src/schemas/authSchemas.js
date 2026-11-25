import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.').max(128),
})

const registrationFields = {
  email: z.string().trim().email('Enter a valid email address.'),
  full_name: z.string().trim().min(1, 'Enter your name.').max(120),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
  confirm_password: z.string().min(1, 'Confirm your password.'),
}

function requireMatchingPasswords(schema) {
  return schema.refine((values) => values.password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match.',
  })
}

export const createOrganizationSchema = requireMatchingPasswords(
  z.object({
    ...registrationFields,
    organization_name: z.string().trim().min(1, 'Enter an organization name.').max(160),
  }),
)

export const joinOrganizationSchema = requireMatchingPasswords(
  z.object({
    ...registrationFields,
    invitation_token: z.string().trim().min(32, 'Enter a valid invitation token.').max(128),
  }),
)
