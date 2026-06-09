import { apiRequest } from "@/lib/api/client"
import type {
  PermissionsRegistry,
  SetUserPermissionsPayload,
} from "@/types/permissions"

export async function getPermissionsRegistry() {
  const response = await apiRequest<PermissionsRegistry>("/permissions")
  return response.data as PermissionsRegistry
}

export async function getUserPermissions(userId: number) {
  const response = await apiRequest<string[]>(`/permissions/users/${userId}`)
  return response.data as string[]
}

export async function setUserPermissions(
  userId: number,
  payload: SetUserPermissionsPayload
) {
  const response = await apiRequest<string[]>(`/permissions/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })

  return response.data as string[]
}
