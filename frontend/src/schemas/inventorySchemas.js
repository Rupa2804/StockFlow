import { z } from 'zod'

const optionalText = (maxLength) =>
  z.string().trim().max(maxLength).transform((value) => value || null)

const optionalPrice = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{1,10}(?:\.\d{1,2})?$/.test(value),
    'Enter a non-negative amount with up to 2 decimal places.',
  )
  .transform((value) => (value === '' ? null : Number(value)))

const nonNegativeInteger = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Enter a whole number greater than or equal to zero.')
  .transform(Number)

const optionalNonNegativeInteger = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d+$/.test(value),
    'Enter a whole number greater than or equal to zero.',
  )
  .transform((value) => (value === '' ? null : Number(value)))

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name.').max(100),
  description: optionalText(500),
})

export const productSchema = z.object({
  sku: z.string().trim().min(1, 'Enter a SKU.').max(64),
  name: z.string().trim().min(1, 'Enter a product name.').max(160),
  description: optionalText(1000),
  unit_price: optionalPrice,
  cost_price: optionalPrice,
  selling_price: optionalPrice,
  stock_quantity: nonNegativeInteger,
  low_stock_threshold: optionalNonNegativeInteger,
  category_id: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+$/.test(value) && Number(value) > 0),
      'Choose a valid category.',
    )
    .transform((value) => (value === '' ? null : Number(value))),
  is_active: z.boolean().optional(),
})

export const stockMovementSchema = z.object({
  movement_type: z.enum(['in', 'out']),
  quantity: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Enter a whole quantity greater than zero.')
    .transform(Number),
  note: optionalText(500),
})
