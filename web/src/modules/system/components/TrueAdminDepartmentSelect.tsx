import type { TreeSelectProps } from 'antd';
import { TreeSelect } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { errorCenter } from '@/core/error/errorCenter';
import type { DepartmentTreeNode } from '../types/department';

export type TrueAdminDepartmentSelectProps = Omit<TreeSelectProps, 'treeData'> & {
  departments?: DepartmentTreeNode[];
  fetchDepartments?: () => Promise<DepartmentTreeNode[]>;
  autoLoad?: boolean;
  onLoadError?: (error: unknown) => false | undefined;
};

const toTreeData = (departments: DepartmentTreeNode[]): TreeSelectProps['treeData'] =>
  departments.map((department) => ({
    title: department.name,
    value: department.id,
    key: department.id,
    children: department.children ? toTreeData(department.children) : undefined,
  }));

const emptyDepartments: DepartmentTreeNode[] = [];

export function TrueAdminDepartmentSelect({
  autoLoad = true,
  departments = emptyDepartments,
  fetchDepartments,
  onLoadError,
  onDropdownVisibleChange,
  onOpenChange,
  treeDefaultExpandAll = true,
  treeNodeFilterProp = 'title',
  showSearch = true,
  ...treeSelectProps
}: TrueAdminDepartmentSelectProps) {
  const [innerDepartments, setInnerDepartments] = useState(departments);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(departments.length > 0);

  useEffect(() => {
    setInnerDepartments(departments);
    if (departments.length > 0) {
      setLoaded(true);
    }
  }, [departments]);

  const loadDepartments = async () => {
    if (!fetchDepartments || loading || loaded) {
      return;
    }
    setLoading(true);
    try {
      setInnerDepartments(await fetchDepartments());
      setLoaded(true);
    } catch (error) {
      if (onLoadError?.(error) !== false) {
        errorCenter.emit(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      void loadDepartments();
    }
  }, [autoLoad]);

  const treeData = useMemo(() => toTreeData(innerDepartments), [innerDepartments]);

  return (
    <TreeSelect
      {...treeSelectProps}
      loading={loading}
      showSearch={showSearch}
      treeData={treeData}
      treeDefaultExpandAll={treeDefaultExpandAll}
      treeNodeFilterProp={treeNodeFilterProp}
      onOpenChange={(open) => {
        onOpenChange?.(open);
        onDropdownVisibleChange?.(open);
        if (open) {
          void loadDepartments();
        }
      }}
    />
  );
}
