# 📧 临时邮箱服务

> **现代化的临时邮箱服务，保护您的隐私，简化邮件管理**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black?style=for-the-badge&logo=shadcnui)](https://ui.shadcn.com/)

## 🎯 产品特性

### ⚡ 核心功能
- **一键生成** - 瞬间创建临时邮箱地址
- **实时接收** - 自动接收并显示邮件
- **隐私保护** - 自动过期，无需注册
- **测试友好** - 内置测试邮件功能

### 🎨 现代化界面
- **邮件风格布局** - 类似 Gmail 的三栏设计
- **主题切换** - 明暗模式，系统主题跟随
- **响应式设计** - 完美支持桌面和移动端
- **实时刷新** - 每10秒自动检查新邮件

### 🔧 用户体验
- **侧边栏导航** - 直观的邮箱管理界面
- **邮件列表** - 现代化的邮件列表视图
- **详细视图** - 完整的邮件查看体验
- **一键操作** - 复制、删除、标记已读、回复等

## 📱 界面预览

### 桌面端
- **左侧侧边栏** - 邮箱管理、快速操作、导航菜单
- **中间邮件列表** - 邮件概览、状态标记、快速操作
- **右侧详情面板** - 邮件内容、回复转发、附件下载

### 移动端
- **自适应布局** - 单栏显示，滑动切换
- **触摸优化** - 手势导航，快速操作
- **响应式组件** - 适配各种屏幕尺寸

## 🚀 快速开始

### 前置要求
- Node.js 18+
- pnpm
- Docker Desktop

### 安装运行

```bash
# 1. 克隆项目
git clone https://github.com/your-username/temp-mail.git
cd temp-mail

# 2. 快速设置 (一键安装)
pnpm setup

# 或者手动安装
pnpm install
docker-compose up -d
npx prisma generate
npx prisma migrate dev
pnpm dev
```

### 立即使用

🎉 **应用地址**: http://localhost:3000

**管理工具**:
- **邮件管理**: http://localhost:8025 (MailHog)
- **数据库**: http://localhost:8080 (Adminer)

## 🏗️ 技术架构

### 前端
- **Next.js 15** - React 框架，App Router
- **React 19** - 最新并发特性
- **TypeScript** - 完整类型安全
- **Tailwind CSS** - 原子化样式
- **shadcn/ui** - 现代化组件库
- **next-themes** - 主题切换系统

### 后端
- **Prisma ORM** - 类型安全数据库操作
- **PostgreSQL** - 主数据库
- **Nodemailer** - 邮件处理
- **Zod** - 数据验证

### 开发环境
- **Docker** - 容器化开发
- **MailHog** - SMTP 测试
- **Redis** - 缓存支持
- **Adminer** - 数据库管理

## 📋 API 接口

### 邮箱管理
```bash
# 创建邮箱
POST /api/addresses

# 获取邮件
GET /api/emails?emailAddressId={id}

# 标记已读
PATCH /api/emails/{id}

# 删除邮件
DELETE /api/emails/{id}
```

### 邮件服务
```bash
# 接收邮件
POST /api/receive-email

# 发送测试邮件
POST /api/send-test-email
```

## ⚙️ 配置

### 环境变量
```env
DATABASE_URL="postgresql://tempmail_user:tempmail_pass@localhost:5432/tempmail_db"
ALLOWED_DOMAINS="tempmail.local,10minutemail.local,guerrillamail.local"
EMAIL_EXPIRATION_MINUTES=60
SMTP_HOST=localhost
SMTP_PORT=1025
```

### 常用命令
```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm lint             # 代码检查

# 数据库
pnpm db:generate      # 生成客户端
pnpm db:studio        # 数据库浏览器
pnpm db:migrate       # 运行迁移

# Docker
pnpm docker:up        # 启动服务
pnpm docker:down      # 停止服务
pnpm docker:clean     # 清理资源
```

## 🎯 使用场景

### 个人用户
- 🛡️ **隐私保护** - 避免主邮箱被骚扰
- 📝 **快速注册** - 临时账号注册验证
- 🧪 **服务测试** - 测试邮件发送功能
- 🎨 **界面美观** - 现代化的邮件管理体验

### 开发团队
- ⚡ **API 测试** - 完整的邮件API
- 🔧 **开发调试** - 本地SMTP测试环境
- 📊 **数据管理** - 可视化数据库界面
- 🎯 **UI/UX 参考** - 现代化界面设计

## 💡 新功能亮点

### 🎨 UI/UX 重构
- **Gmail 风格** - 熟悉的三栏邮件布局
- **主题系统** - 浅色/深色/系统主题
- **响应式设计** - 完美适配各种设备
- **动画效果** - 平滑的交互体验

### 📱 移动端优化
- **Touch 友好** - 优化的触摸交互
- **滑动导航** - 直观的手势操作
- **自适应布局** - 智能适配屏幕

### 🔧 开发体验
- **组件化** - 高度可重用的组件
- **类型安全** - 完整的 TypeScript 支持
- **现代化工具链** - 最新的开发工具

## 🔧 故障排除

### 常见问题

**UI 显示异常**
```bash
# 清除缓存并重启
pnpm clean
pnpm dev
```

**主题切换失败**
```bash
# 检查 next-themes 配置
npm ls next-themes
```

**服务启动失败**
```bash
# 检查端口占用
lsof -i :3000

# 重启Docker服务
pnpm docker:clean
pnpm docker:up
```

**数据库连接错误**
```bash
# 重置数据库
pnpm db:reset

# 检查容器状态
docker-compose ps
```

## 🚀 部署

### 生产环境
1. 配置真实的SMTP服务器
2. 设置生产数据库连接
3. 配置域名和SSL证书
4. 启用环境变量保护

### 性能优化
- 启用Redis缓存
- 配置数据库连接池
- 设置CDN加速
- 监控系统资源

## 📖 文档

- [📚 文档中心](docs/README.md) - 完整的文档导航和索引
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - 详细的部署和配置指南
- [🚀 Vercel 部署](docs/VERCEL_DEPLOYMENT.md) - 云平台部署指南
- [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) - 深度技术架构解析
- [🧪 API 测试结果](docs/API_TEST_RESULTS.md) - 完整的API测试报告和性能分析

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

[MIT License](LICENSE)

---

<div align="center">

**🎉 现在就开始使用吧！** 

[立即体验](http://localhost:3000) • [查看文档](docs/IMPLEMENTATION_GUIDE.md) • [报告问题](../../issues)

**使用现代Web技术构建 ❤️**

</div>

