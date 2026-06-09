export type UserRole = "super_admin" | "admin" | "user"

export type User = {
  id: number
  name: string
  mobile_no: string | null
  email: string | null
  image: string | null
  role: UserRole
  permissions?: string[]
  created_at: string
  updated_at: string
}

export type CreateUserPayload = {
  name: string
  mobile_no?: string | null
  email?: string | null
  image?: string | null
  password: string
  role: UserRole
}

export type UpdateUserPayload = {
  name?: string
  mobile_no?: string | null
  email?: string | null
  image?: string | null
  password?: string
  role?: UserRole
}

export type UsersListParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
  searchTerm?: string
  role?: UserRole
}

export type LoginPayload = {
  identifier: string
  password: string
}

export type LoginResponse = {
  user: User
  accessToken: string
  refreshToken: string
}

export type UpdateProfilePayload = {
  name?: string
  mobile_no?: string | null
  email?: string | null
  image?: string | null
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}
