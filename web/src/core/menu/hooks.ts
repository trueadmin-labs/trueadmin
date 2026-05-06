import { useQuery } from '@tanstack/react-query';
import { menuApi } from './api';

export const menuKeys = {
  tree: ['system', 'menu-tree'] as const,
};

export const useMenuTreeQuery = () =>
  useQuery({
    queryKey: menuKeys.tree,
    queryFn: () => menuApi.tree().send(),
  });
