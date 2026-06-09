import express, { Router } from 'express';

import AuthRoutes from '../modules/auth/auth.routes';
import BrandsRoutes from '../modules/brands/brands.routes';
import CategoriesRoutes from '../modules/categories/categories.routes';
import ItemsRoutes from '../modules/items/items.routes';
import OutRequestsRoutes from '../modules/out-requests/out-requests.routes';
import PermissionsRoutes from '../modules/permissions/permissions.routes';
import ReturnRequestsRoutes from '../modules/return-requests/return-requests.routes';
import PurchaseOrdersRoutes from '../modules/purchase-orders/purchase-orders.routes';
import RequisitionsRoutes from '../modules/requisitions/requisitions.routes';
import StocksRoutes from '../modules/stocks/stocks.routes';
import SubCategoriesRoutes from '../modules/sub-categories/sub-categories.routes';
import UnitsRoutes from '../modules/units/units.routes';
import UsersRoutes from '../modules/users/users.routes';
import VendorsRoutes from '../modules/vendors/vendors.routes';

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
    path: '/permissions',
    routes: PermissionsRoutes,
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
  {
    path: '/requisitions',
    routes: RequisitionsRoutes,
  },
  {
    path: '/vendors',
    routes: VendorsRoutes,
  },
  {
    path: '/purchase-orders',
    routes: PurchaseOrdersRoutes,
  },
  {
    path: '/out-requests',
    routes: OutRequestsRoutes,
  },
  {
    path: '/return-requests',
    routes: ReturnRequestsRoutes,
  },
  {
    path: '/stocks',
    routes: StocksRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.routes));
export default router;
