import { apiRequest } from "@/lib/api/client"
import {
  clearAuthSession,
  setAuthSession,
  updateAuthUser,
} from "@/lib/auth/token"
import type {
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  UpdateProfilePayload,
  User,
} from "@/types/users"

export async function login(payload: LoginPayload) {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  const data = response.data as LoginResponse

  setAuthSession(data.accessToken, data.refreshToken, data.user)

  return data
}

export async function getProfile() {
  const response = await apiRequest<User>("/auth/profile")
  const user = response.data as User
  updateAuthUser(user)
  return user
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const response = await apiRequest<User>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  const user = response.data as User
  updateAuthUser(user)
  return user
}

export async function changePassword(payload: ChangePasswordPayload) {
  await apiRequest<null>("/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function logout() {
  clearAuthSession()
  window.location.href = "/login"
}
