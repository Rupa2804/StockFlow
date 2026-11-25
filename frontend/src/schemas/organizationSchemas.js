import { z } from 'zod'

export const organizationSettingsSchema = z.object({
  default_low_stock_threshold: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Enter a whole number greater than or equal to zero.')
    .transform(Number),
})

export const organizationInvitationSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
})
