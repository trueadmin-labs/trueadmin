# 岗位与权限设计方案

状态：第一阶段已实现

本文定义 TrueAdmin 岗位、角色、菜单权限、接口权限和数据权限之间的关系。该方案已完成第一阶段落地，后续岗位权限相关开发应以本文为准。

## 设计结论

岗位是普通后台成员的授权载体。角色不再被理解为直接分配给用户的组织身份，而是可复用权限包；岗位挂在部门下，并通过绑定一个或多个角色权限包获得菜单、接口和数据权限。

推荐模型：

```text
部门 -> 岗位 -> 角色权限包 -> 菜单权限 + 接口权限 + 数据权限
用户 -> 部门岗位

最终功能权限 = 用户岗位绑定角色权限的并集
最终数据权限 = 用户岗位绑定角色数据策略在岗位部门上下文中的并集
```

岗位可以绑定多个角色，一个用户也可以绑定多个岗位。用户如果属于多个部门，应在每个归属部门下至少绑定一个岗位。普通业务授权不建议直接给用户绑定角色。

`admin_role_user` 仅作为系统初始化、超级管理员、临时运维和历史兼容入口保留，不作为普通成员授权的主路径。后台成员管理第一版应以岗位绑定为主，直接角色展示为特权/兼容信息。

岗位维护主入口放在部门管理中：先选中部门，再维护该部门下的岗位、岗位角色和岗位成员。独立 `/organization/positions` 路由作为高级维护入口保留，但不作为默认导航菜单展示；对应权限点仍保持启用，便于角色权限包授权和部门页内嵌岗位管理调用接口。

不新增以下表：

```text
admin_position_menus
admin_position_permissions
admin_position_data_policies
```

原因是菜单、接口和数据权限如果同时存在于角色和岗位，会形成两套权限事实来源。第一版必须保持角色是唯一权限包配置入口，岗位负责把权限包放入具体部门上下文。

## 概念边界

角色负责表达可复用权限包：

```text
销售负责人角色：客户、线索、商机、销售报表
财务负责人角色：收款、付款、发票、财务报表
```

岗位负责表达“某个部门里的什么职责”，并作为权限生效载体：

```text
销售部负责人岗位：属于销售部，绑定销售负责人角色
财务部负责人岗位：属于财务部，绑定财务负责人角色
```

数据权限仍配置在角色权限包上：

```text
销售负责人角色：客户资源 = 本部门及子部门
财务负责人角色：收付款资源 = 本部门及子部门
```

岗位提供部门上下文。相同的 `department_and_children` 数据范围，挂在销售部负责人岗位上时解析为销售部及子部门，挂在财务部负责人岗位上时解析为财务部及子部门。因此可以说数据权限“通过岗位生效”，但配置事实仍在角色权限包里。

## 为什么不做通用部门负责人角色

不要用一个全局 `部门负责人` 角色承载所有部门负责人的菜单权限。

错误示例：

```text
角色：部门负责人
菜单：客户管理、成员管理、审批管理、财务管理
数据权限：本部门及子部门
```

销售部负责人和财务部负责人通常菜单权限不同。正确做法是按业务职责拆角色，再由具体岗位绑定：

```text
岗位：销售部负责人
部门：销售部
绑定角色：
- 销售负责人
- 销售报表查看
- 审批处理人

岗位：财务部负责人
部门：财务部
绑定角色：
- 财务负责人
- 发票管理
- 财务报表查看
```

这样菜单差异由角色解决，部门范围由岗位上下文解决。

## 数据表建议

第一版新增三张表。

```text
admin_positions
- id
- dept_id
- code
- name
- type
- is_leadership
- description
- sort
- status
- created_by
- updated_by
- created_at
- updated_at
```

约束建议：

```text
unique(dept_id, code)
```

`code` 只在部门内唯一，允许不同部门都存在 `manager`、`leader`、`cashier` 等岗位编码。

```text
admin_user_positions
- user_id
- position_id
- is_primary
- assigned_by
- assigned_at
```

约束建议：

```text
primary(user_id, position_id)
```

用户绑定岗位时，岗位所属部门必须属于用户的部门集合。第一版不自动补部门，Service 层直接拒绝不一致数据，前端提示先把成员加入对应部门。

```text
admin_position_roles
- position_id
- role_id
- sort
- created_at
- updated_at
```

约束建议：

```text
primary(position_id, role_id)
```

岗位可以绑定多个角色。角色仍然通过现有 `admin_role_menu` 和 `admin_role_data_policies` 配置菜单、按钮、接口和数据权限。

## 权限生效规则

运行时需要保留角色来源和岗位上下文。

```text
position role:
  role_id = 20
  source = position
  source_id = position_id
  context_dept_id = position.dept_id

direct role:
  role_id = 10
  source = direct
  context_dept_id = 当前操作部门
```

直接角色仅用于超级管理员、系统初始化管理员、临时运维和历史兼容。

功能权限合并规则：

```text
有效角色 = 用户岗位绑定角色 + 特权/兼容直接角色
有效权限点 = 有效角色授权菜单权限点的并集
```

前端菜单和按钮展示按有效权限点控制。岗位角色默认参与菜单权限并集，不按当前操作部门隐藏菜单。原因是菜单权限表达的是能力入口，真正的数据范围仍由后端数据策略限制。跨部门成员可能同时看到销售和财务入口，但每个资源查询都会按岗位上下文收敛数据范围。

数据权限合并规则：

```text
有效数据范围 = 岗位角色数据策略 OR 特权/兼容直接角色数据策略
```

同一个角色如果通过多个岗位获得，不能简单按角色 ID 去重，因为不同岗位的 `context_dept_id` 不同。Provider 必须为每个岗位上下文生成独立的运行时规则。

## 数据权限上下文解析

当前 `organization` 策略继续作为默认组织数据权限策略。

岗位角色的数据权限：

```text
scope = department
解析为：岗位所属部门

scope = department_and_children
解析为：岗位所属部门及子部门

scope = self
解析为：当前用户

scope = custom_departments
解析为：角色数据策略配置的指定部门
```

特权/兼容直接角色的数据权限：

```text
scope = department
解析为：当前操作部门

scope = department_and_children
解析为：当前操作部门及子部门

scope = self
解析为：当前用户

scope = custom_departments
解析为：角色数据策略配置的指定部门
```

`all` 仍表示全部数据。岗位绑定包含 `all` 数据权限的角色时，应在后台授权界面做高风险提示。普通部门岗位不应绑定全量数据角色。

## 后端实现方向

第一版尽量不改 kernel 契约。

`AdminRoleDataPolicyProvider` 需要从只读取 `actor.claims.roleIds` 调整为读取角色来源：

```text
directRoleIds
positionRoleBindings:
- positionId
- deptId
- roleIds
```

Provider 输出规则时：

```text
直接角色：
  读取角色数据策略，原样返回

岗位角色：
  读取角色数据策略，为每个岗位上下文复制一份 DataPolicyRule
  在 config 中补充运行时上下文：
  _context.source = position
  _context.positionId = position_id
  _context.deptId = position.dept_id
```

`OrganizationDataPolicyStrategy` 读取数据范围时：

```text
如果 rule.config._context.deptId 存在：
  department 类 scope 使用该 deptId
否则：
  使用当前操作部门
```

成员类资源不能只用 `admin_users.primary_dept_id` 判断组织范围，必须同时支持 `admin_user_departments` 归属表。否则多部门成员在非主部门下的岗位成员列表、部门成员列表和部门负责人数据范围会不一致。当前 `admin_user` 数据权限目标已经按成员部门归属表收敛。

这样可以保持 `DataPolicyManager`、`DataPolicyRule`、`DataPolicyTarget` 的 kernel 契约不变。

## Actor 与当前用户接口

后台登录态应保留直接角色和岗位角色的来源信息。

建议当前用户接口返回：

```text
user
departments
positions
directRoles
positionRoles
effectiveRoles
permissions
```

示例：

```json
{
  "positions": [
    {
      "id": 1,
      "name": "销售部负责人",
      "deptId": 10,
      "roleIds": [21, 22]
    }
  ],
  "directRoles": [],
  "positionRoles": ["sales-leader", "sales-report-viewer"],
  "effectiveRoles": ["sales-leader", "sales-report-viewer"]
}
```

Token 中可以只放运行时必要的轻量 claims。若岗位角色较多，可以通过缓存或当前用户服务实时加载，避免 Token 过大。

## 后台页面

岗位管理：

- 岗位列表。
- 岗位新增、编辑、删除。
- 岗位所属部门。
- 岗位状态。
- 岗位绑定角色，多选。
- 岗位成员列表。
- 岗位侧维护成员绑定；候选成员限定为岗位所属部门成员，移除成员时必须保证该成员在对应所属部门仍至少保留一个岗位。

成员管理：

- 所属部门。
- 绑定岗位。
- 直接角色只读展示或折叠展示，用于超级管理员、初始化管理员和历史兼容。
- 有效角色只读展示。

角色管理：

- 继续配置菜单、按钮、接口和数据权限。
- 不新增“岗位权限”配置页。

授权提示：

- 岗位绑定角色时，如果角色包含 `all` 数据范围，展示高风险提示。
- 岗位绑定角色时，展示该角色已配置的数据权限资源和范围，帮助管理员理解岗位实际授权结果。

## 开发顺序

第一阶段实现闭环：

1. 新增岗位、用户岗位、岗位角色迁移。
2. 新增岗位 Model、Repository、Service、Request、Controller。
3. 用户管理支持绑定岗位，并校验岗位部门属于用户部门集合。
4. 岗位管理支持绑定多个角色。
5. 登录和当前用户信息返回直接角色、岗位和有效角色。
6. Permission provider 合并直接角色和岗位角色。
7. Data policy provider 按角色来源生成带上下文的数据策略。
8. `organization` 策略支持岗位上下文部门解析。
9. Web 管理端补齐岗位管理、成员表单绑定岗位、岗位侧维护成员绑定。
10. 补充权限和数据权限测试。

## 非目标

第一版不做：

- 岗位层级。
- 岗位继承。
- 岗位直接菜单授权。
- 岗位直接接口授权。
- 岗位直接数据权限授权。
- deny 数据权限。
- 用户级特例数据权限。

这些能力会显著增加权限解释成本，等真实业务出现明确需求后再设计。
