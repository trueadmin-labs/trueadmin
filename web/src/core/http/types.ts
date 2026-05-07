export type ApiEnvelope<T> = {
  code: string | number;
  message: string;
  data: T;
  success?: boolean;
};

export type PageResult<T, TMeta = Record<string, unknown>> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  meta?: TMeta;
};
