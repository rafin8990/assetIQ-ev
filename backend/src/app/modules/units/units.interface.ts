export type IUnit = {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
};

export type IUnitFilters = {
  searchTerm?: string;
};

export type ICreateUnitPayload = Pick<IUnit, 'name'>;

export type IUpdateUnitPayload = Partial<Pick<IUnit, 'name'>>;
