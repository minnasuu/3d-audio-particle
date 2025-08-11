# 3D Audio Particle

一个基于 Three.js 的 3D 音频粒子可视化项目。

## 功能特性

- 3D 音频粒子可视化
- 实时音频分析
- 交互式粒子系统
- 响应式设计

## 技术栈

- React 18
- TypeScript
- Three.js
- Vite
- SASS

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署到 GitHub Pages

### 方法 1: 使用 npm 脚本（推荐）

```bash
# 部署到 GitHub Pages
npm run deploy
```

这个命令会自动：
1. 构建项目 (`npm run build`)
2. 将构建结果推送到 `gh-pages` 分支

### 方法 2: 使用 GitHub Actions（自动部署）

项目已配置 GitHub Actions 工作流，当你推送代码到 `main` 分支时，会自动构建并部署到 GitHub Pages。

## 配置说明

- `vite.config.ts` 中设置了 `base: '/3d-audio-particle/'`，确保在 GitHub Pages 上正确加载资源
- 部署后访问地址：`https://[你的用户名].github.io/3d-audio-particle/`

## 注意事项

1. 确保你的 GitHub 仓库已启用 GitHub Pages 功能
2. 在仓库设置中选择 `gh-pages` 分支作为源
3. 如果使用 GitHub Actions，确保仓库有适当的权限设置

## 许可证

MIT
