import { SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { getRegisteredIcons } from './iconRegistry';
import { TrueAdminIcon } from './TrueAdminIcon';

export type TrueAdminIconPickerProps = {
  value?: string;
  onChange?: (value?: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const matchIcon = (keyword: string, icon: ReturnType<typeof getRegisteredIcons>[number]) => {
  if (!keyword) {
    return true;
  }

  const normalized = keyword.toLowerCase();
  return (
    icon.key.toLowerCase().includes(normalized) ||
    icon.label.toLowerCase().includes(normalized) ||
    icon.source.toLowerCase().includes(normalized) ||
    icon.keywords.some((item) => item.includes(normalized))
  );
};

export function TrueAdminIconPicker({
  value,
  onChange,
  disabled,
  placeholder,
}: TrueAdminIconPickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const icons = useMemo(() => getRegisteredIcons(), []);
  const filteredIcons = useMemo(
    () => icons.filter((icon) => matchIcon(keyword.trim(), icon)).slice(0, 240),
    [icons, keyword],
  );

  const selected = value ? icons.find((icon) => icon.key === value) : undefined;

  const selectIcon = (key: string) => {
    onChange?.(key);
    setOpen(false);
  };

  return (
    <>
      <Space.Compact block>
        <Input
          readOnly
          disabled={disabled}
          value={value}
          placeholder={placeholder ?? t('icon.picker.placeholder', '选择图标')}
          prefix={value ? <TrueAdminIcon icon={value} /> : null}
        />
        <Button disabled={disabled} onClick={() => setOpen(true)}>
          {t('icon.picker.select', '选择')}
        </Button>
        <Button disabled={disabled || !value} onClick={() => onChange?.('')}>
          {t('icon.picker.clear', '清空')}
        </Button>
      </Space.Compact>
      <Modal
        destroyOnHidden
        open={open}
        title={t('icon.picker.title', '选择图标')}
        width={760}
        footer={null}
        onCancel={() => setOpen(false)}
      >
        <div className="trueadmin-icon-picker">
          <Input
            allowClear
            autoFocus
            value={keyword}
            prefix={<SearchOutlined />}
            placeholder={t('icon.picker.search', '搜索图标名称')}
            onChange={(event) => setKeyword(event.target.value)}
          />
          {selected ? (
            <div className="trueadmin-icon-picker-selected">
              <span className="trueadmin-icon-picker-selected-icon">
                <TrueAdminIcon icon={selected.key} />
              </span>
              <Typography.Text ellipsis>{selected.key}</Typography.Text>
              <Tag>{selected.source}</Tag>
            </div>
          ) : null}
          {filteredIcons.length ? (
            <div className="trueadmin-icon-picker-grid">
              {filteredIcons.map((icon) => (
                <Tooltip key={icon.key} title={`${icon.key} · ${icon.source}`}>
                  <button
                    type="button"
                    className={[
                      'trueadmin-icon-picker-item',
                      icon.key === value ? 'is-selected' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => selectIcon(icon.key)}
                  >
                    <span className="trueadmin-icon-picker-item-icon">{icon.icon}</span>
                    <span className="trueadmin-icon-picker-item-name">{icon.key}</span>
                  </button>
                </Tooltip>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('icon.picker.empty', '暂无匹配图标')}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
