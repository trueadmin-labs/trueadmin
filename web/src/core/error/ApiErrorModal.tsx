import {
  CheckCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@ant-design/icons';
import type { ApiError } from '@trueadmin/web-core/error';
import type {
  ErrorRenderable,
  ErrorRenderContext,
  ErrorSeverity,
} from '@trueadmin/web-react/error';
import { resolveRenderableTrans } from '@trueadmin/web-react/i18n';
import { Button, Collapse, Space, Typography } from 'antd';
import { motion } from 'motion/react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import { useLayoutStore } from '@/core/store/layoutStore';
import { getErrorExplanation } from './errorRegistry';
import './error.css';

const toReasonText = (details: unknown): string | undefined => {
  if (typeof details !== 'object' || details === null) {
    return undefined;
  }

  if ('data' in details && typeof details.data === 'object' && details.data !== null) {
    return toReasonText(details.data);
  }

  if ('reason' in details && typeof details.reason === 'string') {
    return details.reason;
  }

  return undefined;
};

const toTraceId = (details: unknown): string | undefined => {
  if (typeof details !== 'object' || details === null) {
    return undefined;
  }

  if ('traceId' in details && typeof details.traceId === 'string') {
    return details.traceId;
  }

  if ('data' in details && typeof details.data === 'object' && details.data !== null) {
    return toTraceId(details.data);
  }

  return undefined;
};

const severityMeta: Record<ErrorSeverity, { className: string; icon: React.ReactNode }> = {
  info: { className: 'is-info', icon: <InfoCircleFilled /> },
  warning: { className: 'is-warning', icon: <ExclamationCircleFilled /> },
  error: { className: 'is-error', icon: <CloseCircleFilled /> },
};

export type ApiErrorModalProps = {
  error: ApiError | null;
  open: boolean;
  onClose: () => void;
  afterOpenChange?: (open: boolean) => void;
};

export function ApiErrorModal({ error, open, onClose, afterOpenChange }: ApiErrorModalProps) {
  const { t } = useI18n();
  const darkMode = useLayoutStore((state) => state.darkMode);

  if (!error) {
    return null;
  }

  const explanation = getErrorExplanation(error.code);
  const reason = toReasonText(error.details);
  const traceId = toTraceId(error.details);
  const context: ErrorRenderContext = { error, t, reason, traceId };
  const hasExplanation = Boolean(explanation);
  const defaultMessage = t('error.default.requestFailed', '请求失败');
  const title = resolveRenderableTrans(explanation?.title, context, t, defaultMessage);
  const severity = explanation?.severity || 'error';
  const description = resolveRenderableTrans(explanation?.description, context, t);
  const suggestions: React.ReactNode[] = (explanation?.suggestions ?? []).map(
    (suggestion: ErrorRenderable) => resolveRenderableTrans(suggestion, context, t),
  );
  const visibleSuggestions = suggestions.slice(0, 2);
  const meta = severityMeta[severity];
  const primaryMessage = hasExplanation ? description : error.message || defaultMessage;

  const detailItems = [
    {
      key: 'code',
      label: t('error.modal.code', '错误码'),
      content: (
        <Typography.Text copyable className="trueadmin-error-modal-code-text">
          {error.code}
        </Typography.Text>
      ),
    },
    ...(error.status
      ? [
          {
            key: 'status',
            label: t('error.modal.httpStatus', 'HTTP 状态'),
            content: <Typography.Text>{error.status}</Typography.Text>,
          },
        ]
      : []),
    ...(reason
      ? [
          {
            key: 'reason',
            label: t('error.modal.apiReason', '接口原因'),
            content: <Typography.Text>{reason}</Typography.Text>,
          },
        ]
      : []),
    ...(traceId
      ? [
          {
            key: 'traceId',
            label: t('error.modal.traceId', 'Trace ID'),
            content: <Typography.Text copyable>{traceId}</Typography.Text>,
          },
        ]
      : []),
  ];

  return (
    <TrueAdminModal
      open={open}
      title={t('error.modal.title', '操作未完成')}
      onCancel={onClose}
      afterOpenChange={afterOpenChange}
      footer={
        <Space size={10}>
          {explanation?.docUrl ? (
            <Button href={explanation.docUrl} target="_blank" rel="noreferrer">
              {t('error.modal.viewDocs', '查看处理文档')}
            </Button>
          ) : null}
          <Button type="primary" onClick={onClose}>
            {t('error.modal.ok', '知道了')}
          </Button>
        </Space>
      }
      width={560}
      className={`trueadmin-error-modal-root${darkMode ? ' is-dark' : ''}`}
    >
      <motion.div
        className="trueadmin-error-modal"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <section className={`trueadmin-error-modal-summary-card ${meta.className}`}>
          <span className="trueadmin-error-modal-icon">{meta.icon}</span>
          <div className="trueadmin-error-modal-summary">
            <Typography.Title level={4} className="trueadmin-error-modal-main-title">
              {title}
            </Typography.Title>
            {primaryMessage ? (
              <Typography.Paragraph className="trueadmin-error-modal-message">
                {primaryMessage}
              </Typography.Paragraph>
            ) : null}
          </div>
        </section>

        {visibleSuggestions.length > 0 ? (
          <section className="trueadmin-error-modal-action-list">
            <Typography.Title level={5}>
              <CheckCircleOutlined />
              <span>{t('error.modal.suggestions', '建议处理')}</span>
            </Typography.Title>
            <ul>
              {visibleSuggestions.map((suggestion, index) => (
                <li key={String(index)}>{suggestion}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {explanation?.extra?.(context)}

        <Collapse
          ghost
          size="small"
          className="trueadmin-error-modal-details"
          items={[
            {
              key: 'details',
              label: t('error.modal.details', '错误详情'),
              children: (
                <section className="trueadmin-error-modal-diagnostics">
                  {detailItems.map((item) => (
                    <div className="trueadmin-error-modal-diagnostic-item" key={item.key}>
                      <span>{item.label}</span>
                      {item.content}
                    </div>
                  ))}
                </section>
              ),
            },
          ]}
        />
      </motion.div>
    </TrueAdminModal>
  );
}
