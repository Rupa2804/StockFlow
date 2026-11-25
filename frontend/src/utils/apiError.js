export function getApiErrorMessage(error, fallback) {
  const status = error?.response?.status
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(' ')
  }
  if (status === 401) {
    return 'Your sign-in details are not valid. Please try again.'
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.'
  }
  if (!error?.response) {
    return 'Could not reach StockFlow. Check your connection and try again.'
  }
  return fallback
}
