# 流畅人生管理后台前端

## 项目说明

这是流畅人生应用的管理后台前端界面，提供可视化的管理功能。

## 功能模块

1. **数据概览** - 查看系统整体统计数据
2. **用户管理** - 管理注册用户，支持搜索和删除
3. **帖子管理** - 管理感悟广场的帖子，支持搜索和删除
4. **房间管理** - 管理对练房间，支持开启/关闭和删除
5. **训练统计** - 查看训练记录统计和详细记录

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## 安装依赖

```bash
npm install
```

## 启动开发服务器

```bash
npm run dev
```

服务默认运行在 `http://localhost:5173` (如果端口被占用会自动选择其他端口)

## 构建生产版本

```bash
npm run build
```

## 登录信息

- 用户名: `admin`
- 密码: `admin123`

## API配置

默认API地址: `http://localhost:8082/api/v1`

可在 `src/services/api.ts` 中修改 `API_BASE_URL`
