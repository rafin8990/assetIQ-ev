export type ILocation = {
  id: number;
  name: string;
  location_code: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ILocationFilters = {
  searchTerm?: string;
};

export type ICreateLocationPayload = Pick<ILocation, 'name'>;

export type IUpdateLocationPayload = Partial<Pick<ILocation, 'name'>>;
