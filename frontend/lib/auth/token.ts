import type { User } from "@/types/users"

export const ACCESS_TOKEN_KEY = "assetiq_access_token"
export const REFRESH_TOKEN_KEY = "assetiq_refresh_token"
export const AUTH_USER_KEY = "assetiq_auth_user"
export const AUTH_COOKIE_NAME = "assetiq_access_token"

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24

function setAuthCookie(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

export function getAccessToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function syncAuthCookie() {
  const token = getAccessToken()
  if (token) {
    setAuthCookie(token)
  }
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAuthSession(
  accessToken: string,
  refreshToken: string,
  user?: User
) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
  setAuthCookie(accessToken)
}

export function updateAuthUser(user: User) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function getAuthUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  clearAuthCookie()
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    )
    return payload
  } catch {
    return null
  }
}

export function isAccessTokenExpired(token?: string | null) {
  const accessToken = token ?? getAccessToken()
  if (!accessToken) return true

  const payload = decodeJwtPayload(accessToken)
  if (!payload?.exp) return false

  return payload.exp <= Math.floor(Date.now() / 1000)
}

let isRedirectingToLogin = false

export function handleSessionExpired(redirectPath?: string) {
  if (typeof window === "undefined" || isRedirectingToLogin) return

  isRedirectingToLogin = true
  clearAuthSession()

  const redirect =
    redirectPath && redirectPath !== "/login"
      ? `?redirect=${encodeURIComponent(redirectPath)}`
      : ""

  window.location.href = `/login${redirect}`
}

export function getUserInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("")
}
