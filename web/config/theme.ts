import { type ThemeConfig, theme } from 'antd';

export const themeConfig: ThemeConfig = {
  cssVar: { prefix: 'trueadmin' },
  hashed: true,
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    wireframe: false,
  },
};
