import {
  CheckCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Button, Modal, Space, Tag, Typography } from 'antd';
import { motion } from 'motion/react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { resolveRenderableTrans } from '@/core/i18n/trans';
import { useLayoutStore } from '@/core/store/layoutStore';
import type { ApiError } from './ApiError';
import { getErrorExplanation } from './errorRegistry';
import type { ErrorRenderContext, ErrorSeverity } from './types';

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

const severityMeta: Record<
  ErrorSeverity,
  { className: string; color: string; icon: React.ReactNode }
> = {
  info: { className: 'is-info', color: 'blue', icon: <InfoCircleFilled /> },
  warning: { className: 'is-warning', color: 'gold', icon: <ExclamationCircleFilled /> },
  error: { className: 'is-error', color: 'red', icon: <CloseCircleFilled /> },
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
  const title = resolveRenderableTrans(
    explanation?.title,
    context,
    t,
    error.message || t('error.default.requestFailed', '请求失败'),
  );
  const severity = explanation?.severity || 'error';
  const description = resolveRenderableTrans(explanation?.description, context, t);
  const causes =
    explanation?.causes?.map((cause) => resolveRenderableTrans(cause, context, t)) ?? [];
  const suggestions =
    explanation?.suggestions?.map((suggestion) => resolveRenderableTrans(suggestion, context, t)) ??
    [];
  const meta = severityMeta[severity];

  return (
    <Modal
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
      width={680}
      className={`trueadmin-error-modal-root${darkMode ? ' is-dark' : ''}`}
    >
      <motion.div
        className="trueadmin-error-modal"
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <section className={`trueadmin-error-modal-hero ${meta.className}`}>
          <span className="trueadmin-error-modal-icon">{meta.icon}</span>
          <div className="trueadmin-error-modal-summary">
            <div className="trueadmin-error-modal-title-row">
              <Typography.Title level={4} className="trueadmin-error-modal-main-title">
                {title}
              </Typography.Title>
              <Tag color={meta.color}>{t(`error.modal.severity.${severity}`, severity)}</Tag>
            </div>
            <Typography.Paragraph type="secondary" className="trueadmin-error-modal-message">
              {error.message}
            </Typography.Paragraph>
            {description ? (
              <div className="trueadmin-error-modal-description">{description}</div>
            ) : null}
          </div>
        </section>

        <div className="trueadmin-error-modal-grid">
          {(causes.length > 0 || reason) && (
            <section className="trueadmin-error-modal-panel">
              <Typography.Title level={5}>
                <QuestionCircleOutlined />
                <span>{t('error.modal.causes', '可能原因')}</span>
              </Typography.Title>
              <ul>
                {causes.map((cause, index) => (
                  <li key={String(index)}>{cause}</li>
                ))}
                {reason && (
                  <li>
                    {t('error.modal.apiReason', '接口原因：')}
                    {reason}
                  </li>
                )}
              </ul>
            </section>
          )}

          {suggestions.length > 0 ? (
            <section className="trueadmin-error-modal-panel">
              <Typography.Title level={5}>
                <CheckCircleOutlined />
                <span>{t('error.modal.suggestions', '建议处理')}</span>
              </Typography.Title>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={String(index)}>{suggestion}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {explanation?.extra?.(context)}

        <section className="trueadmin-error-modal-diagnostics">
          <div className="trueadmin-error-modal-diagnostic-item">
            <span>{t('error.modal.code', '错误码')}</span>
            <Typography.Text copyable className="trueadmin-error-modal-code-text">
              {error.code}
            </Typography.Text>
          </div>
          {error.status ? (
            <div className="trueadmin-error-modal-diagnostic-item">
              <span>{t('error.modal.httpStatus', 'HTTP 状态')}</span>
              <Typography.Text>{error.status}</Typography.Text>
            </div>
          ) : null}
          {traceId ? (
            <div className="trueadmin-error-modal-diagnostic-item">
              <span>{t('error.modal.traceId', 'Trace ID')}</span>
              <Typography.Text copyable>{traceId}</Typography.Text>
            </div>
          ) : null}
        </section>
      </motion.div>
    </Modal>
  );
}
