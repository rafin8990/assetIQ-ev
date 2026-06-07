import { apiRequest } from "@/lib/api/client"
import type { PaginationMeta } from "@/lib/api/types"
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UsersListParams,
} from "@/types/users"

function buildQuery(params: UsersListParams) {
  const search = new URLSearchParams()

  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.sortBy) search.set("sortBy", params.sortBy)
  if (params.sortOrder) search.set("sortOrder", params.sortOrder)
  if (params.searchTerm) search.set("searchTerm", params.searchTerm)
  if (params.role) search.set("role", params.role)

  const query = search.toString()
  return query ? `?${query}` : ""
}

export async function getUsers(params: UsersListParams = {}) {
  const response = await apiRequest<User[]>(`/users${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getAdminUsers(params: UsersListParams = {}) {
  const response = await apiRequest<User[]>(`/users/admins${buildQuery(params)}`)

  return {
    data: response.data ?? [],
    meta: response.meta as PaginationMeta,
  }
}

export async function getUser(id: number) {
  const response = await apiRequest<User>(`/users/${id}`)
  return response.data as User
}

export async function createUser(payload: CreateUserPayload) {
  const response = await apiRequest<User>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data as User
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  const response = await apiRequest<User>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return response.data as User
}

export async function deleteUser(id: number) {
  const response = await apiRequest<User>(`/users/${id}`, {
    method: "DELETE",
  })

  return response.data as User
}
