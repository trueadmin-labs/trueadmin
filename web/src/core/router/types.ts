export type TrueAdminRoute = {
  path?: string;
  name?: string;
  icon?: string;
  component?: string;
  redirect?: string;
  layout?: false;
  access?: string;
  routes?: TrueAdminRoute[];
};
