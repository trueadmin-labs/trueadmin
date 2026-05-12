import { trans } from '@trueadmin/web-core/i18n';
import type { ErrorExplanation } from '@trueadmin/web-react/error';
import { enabledManifests } from '@/core/module/registry';

const builtinErrors: Record<string, ErrorExplanation> = {
  'KERNEL.AUTH.UNAUTHORIZED': {
    title: trans('error.builtin.unauthorized.title', '登录状态已失效'),
    description: trans(
      'error.builtin.unauthorized.description',
      '当前会话不可用或已过期，请重新登录后继续操作。',
    ),
    causes: [
      trans('error.builtin.unauthorized.cause.missingToken', 'Token 缺失或已过期'),
      trans('error.builtin.unauthorized.cause.accountChanged', '账号状态发生变化'),
      trans('error.builtin.unauthorized.cause.sessionCleared', '登录信息被清理'),
    ],
    suggestions: [
      trans('error.builtin.unauthorized.suggestion.loginAgain', '重新登录'),
      trans(
        'error.builtin.unauthorized.suggestion.contactAdmin',
        '如果频繁出现，请联系管理员检查认证配置',
      ),
    ],
    severity: 'warning',
  },
  'KERNEL.AUTH.FORBIDDEN': {
    title: trans('error.builtin.forbidden.title', '无权访问'),
    description: trans('error.builtin.forbidden.description', '当前账号没有执行该操作所需的权限。'),
    causes: [
      trans('error.builtin.forbidden.cause.roleMissing', '角色未授予对应权限'),
      trans('error.builtin.forbidden.cause.metadataNotSynced', '权限元数据尚未同步'),
      trans('error.builtin.forbidden.cause.scopeLimited', '账号所在部门或角色被限制'),
    ],
    suggestions: [
      trans('error.builtin.forbidden.suggestion.assignPermission', '联系管理员分配权限'),
      trans('error.builtin.forbidden.suggestion.refresh', '刷新页面后重试'),
    ],
    severity: 'warning',
  },
  'KERNEL.VALIDATION_FAILED': {
    title: trans('error.builtin.validation.title', '提交数据不符合要求'),
    description: trans(
      'error.builtin.validation.description',
      '请检查表单字段是否填写完整且格式正确。',
    ),
    suggestions: [
      trans('error.builtin.validation.suggestion.fixFields', '根据页面提示修正字段'),
      trans(
        'error.builtin.validation.suggestion.contactAdmin',
        '如果提示不明确，请联系管理员查看接口返回详情',
      ),
    ],
    severity: 'warning',
  },
  'WEB.NETWORK': {
    title: trans('error.builtin.network.title', '网络连接异常'),
    description: trans('error.builtin.network.description', '前端无法连接到后端服务。'),
    causes: [
      trans('error.builtin.network.cause.backendDown', '后端服务未启动'),
      trans('error.builtin.network.cause.disconnected', '网络连接中断'),
      trans('error.builtin.network.cause.proxy', '开发代理配置不正确'),
    ],
    suggestions: [
      trans('error.builtin.network.suggestion.startBackend', '确认后端服务已启动'),
      trans('error.builtin.network.suggestion.retry', '稍后重试'),
      trans('error.builtin.network.suggestion.checkConsole', '检查浏览器控制台中的请求地址'),
    ],
    severity: 'error',
  },
  'WEB.UNKNOWN': {
    title: trans('error.builtin.unknown.title', '未知错误'),
    description: trans('error.builtin.unknown.description', '系统遇到了未识别的异常。'),
    suggestions: [
      trans('error.builtin.unknown.suggestion.retry', '刷新页面后重试'),
      trans(
        'error.builtin.unknown.suggestion.contactAdmin',
        '如果仍然失败，请联系管理员并提供错误码',
      ),
    ],
    severity: 'error',
  },
};

export const errorRegistry = Object.assign(
  {},
  builtinErrors,
  ...enabledManifests.map((manifest) => manifest.errors ?? {}),
);

export const getErrorExplanation = (code: string): ErrorExplanation | undefined =>
  errorRegistry[code];
