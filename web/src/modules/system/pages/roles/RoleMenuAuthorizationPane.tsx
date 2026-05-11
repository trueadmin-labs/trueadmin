import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Space, Switch, Tooltip, Tree, Typography } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import type { AdminMenu } from '../../types/menu';
import {
  getMenuChildTreeKeys,
  getMenuTreeKeys,
  mergeMenuGroupCheckedKeys,
  toMenuTreeData,
  uniqueKeys,
} from './roleAuthorization';

type RoleMenuAuthorizationPaneProps = {
  authorizeLoading: boolean;
  checkedMenuIds: React.Key[];
  expandedMenuIds: React.Key[];
  menuGroupKeysMap: Map<number, React.Key[]>;
  menuTree: AdminMenu[];
  setCheckedMenuIds: Dispatch<SetStateAction<React.Key[]>>;
  setExpandedMenuIds: Dispatch<SetStateAction<React.Key[]>>;
  setStrictMenuCheck: (checked: boolean) => void;
  strictMenuCheck: boolean;
  t: (key: string, fallback?: string) => string;
  onToggleMenuGroupRoot: (menu: AdminMenu, checked: boolean) => void;
};

export function RoleMenuAuthorizationPane({
  authorizeLoading,
  checkedMenuIds,
  expandedMenuIds,
  menuGroupKeysMap,
  menuTree,
  setCheckedMenuIds,
  setExpandedMenuIds,
  setStrictMenuCheck,
  strictMenuCheck,
  t,
  onToggleMenuGroupRoot,
}: RoleMenuAuthorizationPaneProps) {
  return (
    <div className="trueadmin-role-authorize-pane">
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <div className="trueadmin-role-authorize-tree-toolbar">
          <Space size={4}>
            <Tooltip title={t('system.roles.authorize.expandAll', '展开全部')}>
              <Button
                disabled={authorizeLoading || menuTree.length === 0}
                icon={<CaretDownOutlined />}
                size="small"
                type="text"
                onClick={() => setExpandedMenuIds(getMenuTreeKeys(menuTree))}
              />
            </Tooltip>
            <Tooltip title={t('system.roles.authorize.collapseAll', '收起全部')}>
              <Button
                disabled={authorizeLoading || expandedMenuIds.length === 0}
                icon={<CaretUpOutlined />}
                size="small"
                type="text"
                onClick={() => setExpandedMenuIds([])}
              />
            </Tooltip>
          </Space>
          <Space size={8}>
            <Typography.Text type="secondary">
              {t('system.roles.authorize.strictCheck', '精准勾选')}
            </Typography.Text>
            <Switch
              checked={strictMenuCheck}
              disabled={authorizeLoading}
              size="small"
              onChange={setStrictMenuCheck}
            />
          </Space>
        </div>
        <div className="trueadmin-menu-permission-card-list">
          {menuTree.map((menu) => {
            const groupKeys = menuGroupKeysMap.get(menu.id) ?? getMenuTreeKeys([menu]);
            const childKeys = getMenuChildTreeKeys(menu);
            const childCheckedCount = childKeys.filter((key) =>
              checkedMenuIds.includes(key),
            ).length;
            const childTreeData = toMenuTreeData(menu.children ?? []);

            return (
              <Card
                className="trueadmin-menu-permission-card"
                key={menu.id}
                size="small"
                title={
                  <Checkbox
                    checked={checkedMenuIds.includes(menu.id)}
                    disabled={authorizeLoading}
                    indeterminate={!checkedMenuIds.includes(menu.id) && childCheckedCount > 0}
                    onChange={(event) => onToggleMenuGroupRoot(menu, event.target.checked)}
                  >
                    {menu.name}
                  </Checkbox>
                }
              >
                {childTreeData && childTreeData.length > 0 ? (
                  <Tree
                    checkable
                    checkStrictly={strictMenuCheck}
                    expandedKeys={expandedMenuIds.filter((key) => childKeys.includes(key))}
                    treeData={childTreeData}
                    checkedKeys={checkedMenuIds.filter((key) => childKeys.includes(key))}
                    onCheck={(keys) => {
                      const nextChildKeys = Array.isArray(keys) ? keys : keys.checked;
                      setCheckedMenuIds((current) =>
                        mergeMenuGroupCheckedKeys(current, groupKeys, menu.id, nextChildKeys),
                      );
                    }}
                    onExpand={(keys) =>
                      setExpandedMenuIds((current) => {
                        const childKeySet = new Set(childKeys);
                        return uniqueKeys([
                          ...current.filter((key) => !childKeySet.has(key)),
                          ...keys,
                        ]);
                      })
                    }
                  />
                ) : (
                  <Typography.Text type="secondary">
                    {t('system.roles.authorize.emptyGroup', '暂无子权限')}
                  </Typography.Text>
                )}
              </Card>
            );
          })}
        </div>
      </Space>
    </div>
  );
}
