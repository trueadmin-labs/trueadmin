export type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const payload = await promise;
  return payload.data;
}
