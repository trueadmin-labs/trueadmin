# TrueAdmin Mobile

移动端目录用于承载轻量管理端。

## 技术选择

- uni-app。
- Vue 3。
- TypeScript。
- Wot UI。

## 定位

移动端不是完整后台管理系统，而是给管理人员处理移动事务的轻量入口。

优先场景：

- 登录。
- 消息。
- 待办。
- 审批。
- 个人中心。

## Wot UI

Wot UI 是一个现代 uni-app 组件库，支持暗黑模式、国际化、自定义主题，并强调 AI 友好。

TrueAdmin 移动端后续优先使用 Wot UI 组件和生态能力。

## 推荐结构

```text
src/
  pages/
  components/
  services/
  stores/
  utils/
```

## AI 开发提醒

移动端新增页面时，应优先考虑移动交互，不要照搬 Web 管理端的信息密度。

