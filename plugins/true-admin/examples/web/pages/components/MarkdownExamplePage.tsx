import { Card, Space } from 'antd';
import { useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminMarkdown, TrueAdminMarkdownEditor } from '@/core/markdown';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const initialMarkdown = `## 系统维护公告

本周五 22:00 将进行后台服务维护，预计影响 30 分钟。

- 维护期间仍可查看历史数据
- 新增、编辑、导入任务会暂时暂停
- 如遇异常，请联系系统管理员

> Markdown 预览默认禁用原始 HTML，通知和公告附件请使用附件列表承接。

| 模块 | 影响范围 |
| --- | --- |
| 用户管理 | 只读 |
| CRUD 示例 | 暂停导入 |

\`\`\`ts
notification.send({
  type: 'system',
  level: 'warning',
  source: 'system',
});
\`\`\`
`;

export default function MarkdownExamplePage() {
  const { t } = useI18n();
  const [value, setValue] = useState(initialMarkdown);

  return (
    <TrueAdminPage
      title={t('examples.markdown.title', 'Markdown 示例')}
      description={t(
        'examples.markdown.description',
        '展示安全 Markdown 渲染和编辑/预览切换，供公告、消息详情等场景复用。',
      )}
      contentAlign="center"
      contentWidth={920}
    >
      <Space orientation="vertical" size={12} className="trueadmin-example-stack">
        <Card size="small" title={t('examples.markdown.editor.title', '编辑与预览')}>
          <TrueAdminMarkdownEditor
            value={value}
            rows={12}
            placeholder={t('examples.markdown.editor.placeholder', '请输入 Markdown 内容')}
            onChange={setValue}
          />
        </Card>
        <Card size="small" title={t('examples.markdown.render.title', '只读渲染')}>
          <TrueAdminMarkdown value={value} />
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
