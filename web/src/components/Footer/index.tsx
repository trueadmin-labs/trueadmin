import { Divider } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const COMMIT_HASH = process.env.COMMIT_HASH || '';

const useStyles = createStyles(({ token, css }) => ({
  footer: css`
    padding: 16px 24px;
    text-align: center;
    color: ${token.colorTextDescription};
    font-size: ${token.fontSizeSM}px;
    line-height: ${token.lineHeight};
    background: transparent;
  `,
  meta: css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px 12px;
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM - 1}px;
  `,
  label: css`
    color: ${token.colorTextQuaternary};
  `,
}));

const Footer: React.FC = () => {
  const { styles } = useStyles();
  const year = new Date().getFullYear();

  return (
    <div className={styles.footer}>
      <div>TrueAdmin &copy; {year}</div>
      <div className={styles.meta}>
        <span>
          <span className={styles.label}>version</span> {__APP_VERSION__}
        </span>
        {COMMIT_HASH && (
          <>
            <Divider type="vertical" />
            <span>
              <span className={styles.label}>commit</span>{' '}
              {COMMIT_HASH.slice(0, 7)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default Footer;
