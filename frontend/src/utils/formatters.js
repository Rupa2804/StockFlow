const numberFormatter = new Intl.NumberFormat()
const priceFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatNumber(value) {
  return numberFormatter.format(value)
}

export function formatPrice(value) {
  return value == null ? '—' : priceFormatter.format(Number(value))
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
