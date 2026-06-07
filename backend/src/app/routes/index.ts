import express, { Router } from 'express';

import AuthRoutes from '../modules/auth/auth.routes';
import BrandsRoutes from '../modules/brands/brands.routes';
import CategoriesRoutes from '../modules/categories/categories.routes';
import ItemsRoutes from '../modules/items/items.routes';
import SubCategoriesRoutes from '../modules/sub-categories/sub-categories.routes';
import UnitsRoutes from '../modules/units/units.routes';
import UsersRoutes from '../modules/users/users.routes';

const router = express.Router();

type ModuleRoute = {
  path: string;
  routes: Router;
};

const moduleRoutes: ModuleRoute[] = [
  {
    path: '/auth',
    routes: AuthRoutes,
  },
  {
    path: '/users',
    routes: UsersRoutes,
  },
  {
    path: '/categories',
    routes: CategoriesRoutes,
  },
  {
    path: '/sub-categories',
    routes: SubCategoriesRoutes,
  },
  {
    path: '/brands',
    routes: BrandsRoutes,
  },
  {
    path: '/items',
    routes: ItemsRoutes,
  },
  {
    path: '/units',
    routes: UnitsRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.routes));
export default router;
