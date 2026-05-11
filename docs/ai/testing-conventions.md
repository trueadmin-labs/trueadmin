# 测试约定

## 后端

后端模块至少应覆盖：

- Request 参数校验。
- Service 业务规则。
- Repository 查询条件。
- Controller 关键接口。
- 权限失败场景。

标准后台 CRUD 还应覆盖：

- `list/detail/create/update/delete` 主路径。
- `page/pageSize/keyword/filter[field]/op[field]/sort/order` 查询协议。
- 重复编码、资源不存在、删除保护等业务失败场景。
- 按钮权限码写入接口元数据或菜单权限同步结果。
- `admin.<module>.<resource>.<action>` 操作日志落库。

## Web 管理端

Web 端至少应覆盖：

- API 请求封装类型。
- 页面关键状态。
- 权限按钮显示规则。
- 表单校验规则。

## 移动端

移动端至少应覆盖：

- 登录态处理。
- 接口错误提示。
- 待办和审批操作的关键路径。

## AI 输出要求

AI 完成任务后应说明：

- 运行了哪些测试。
- 哪些测试无法运行。
- 无法运行的原因。
- 仍然存在的风险。
