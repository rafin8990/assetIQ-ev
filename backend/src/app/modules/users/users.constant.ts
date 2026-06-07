export const USERS_FILTERABLE_FIELDS = ['searchTerm', 'role'];

export const USERS_SORTABLE_FIELDS = [
  'id',
  'name',
  'email',
  'mobile_no',
  'role',
  'created_at',
  'updated_at',
] as const;

export const USER_PUBLIC_FIELDS = `
  id, name, mobile_no, email, image, role, created_at, updated_at
`;
