const ACCESS_TOKEN_KEY = 'stockflow.access_token'
export const UNAUTHORIZED_EVENT = 'stockflow:unauthorized'

export function getAccessToken() {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token) {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}
