import { QueryClient } from '@tanstack/react-query';
import { errorCenter } from '@/core/error/errorCenter';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      onError: (error) => {
        errorCenter.emit(error);
      },
    },
  },
});
