export default {
  'menu.system': '系统管理',
  'menu.system.users': '用户管理',
  'system.users.title': '管理员用户',
  'system.errors.user.usernameExists.title': '用户名已存在',
  'system.errors.user.usernameExists.description': '该用户名已经被其他管理员账号占用。',
  'system.errors.user.usernameExists.cause.duplicate': '新增或编辑管理员时使用了重复用户名',
  'system.errors.user.usernameExists.cause.imported': '导入数据中存在同名账号',
  'system.errors.user.usernameExists.suggestion.rename': '更换用户名',
  'system.errors.user.usernameExists.suggestion.search':
    '在管理员用户列表中搜索该用户名确认是否已存在',
  'system.errors.user.notFound.title': '管理员用户不存在',
  'system.errors.user.notFound.description':
    '目标管理员账号不存在，可能已被删除或当前账号无权查看。',
  'system.errors.user.notFound.cause.deleted': '数据已被其他管理员删除',
  'system.errors.user.notFound.cause.stale': '当前列表数据不是最新状态',
  'system.errors.user.notFound.suggestion.refresh': '刷新列表后重试',
  'system.errors.user.notFound.suggestion.permission': '确认当前账号是否有查看该用户的权限',
};
