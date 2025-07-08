# 📧 临时邮箱服务

> **现代化的临时邮箱服务，保护您的隐私，简化邮件管理**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

## 🎯 产品特性

### ⚡ 核心功能
- **一键生成** - 瞬间创建临时邮箱地址
- **实时接收** - 自动接收并显示邮件
- **隐私保护** - 自动过期，无需注册
- **测试友好** - 内置测试邮件功能

### 🎨 用户体验
- **响应式设计** - 完美支持桌面和移动端
- **实时刷新** - 每10秒自动检查新邮件
- **双视图模式** - 列表和详细视图随意切换
- **一键操作** - 复制、删除、标记已读

## 🚀 快速开始

### 前置要求
- Node.js 18+
- pnpm
- Docker Desktop

### 安装运行

```bash
# 1. 安装依赖
pnpm install

# 2. 启动服务
docker-compose up -d

# 3. 初始化数据库
npx prisma generate
npx prisma migrate dev

# 4. 启动应用
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
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - 组件库

### 后端
- **Prisma ORM** - 数据库操作
- **PostgreSQL** - 主数据库
- **Nodemailer** - 邮件处理
- **Zod** - 数据验证

### 开发环境
- **Docker** - 容器化开发
- **MailHog** - SMTP 测试
- **Redis** - 缓存支持

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

# 数据库
npx prisma generate   # 生成客户端
npx prisma studio     # 数据库浏览器

# Docker
docker-compose up -d  # 启动服务
docker-compose down   # 停止服务
```

## 🎯 使用场景

### 个人用户
- 🛡️ **隐私保护** - 避免主邮箱被骚扰
- 📝 **快速注册** - 临时账号注册验证
- 🧪 **服务测试** - 测试邮件发送功能

### 开发团队
- ⚡ **API 测试** - 完整的邮件API
- 🔧 **开发调试** - 本地SMTP测试环境
- 📊 **数据管理** - 可视化数据库界面

## 🔧 故障排除

### 常见问题

**服务启动失败**
```bash
# 检查端口占用
lsof -i :3000

# 重启Docker服务
docker-compose restart
```

**数据库连接错误**
```bash
# 重置数据库
npx prisma migrate reset

# 检查容器状态
docker-compose ps
```

**SMTP发送失败**
```bash
# 查看MailHog日志
docker logs tempmail-mailhog

# 访问邮件管理界面
open http://localhost:8025
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

- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - 详细的部署和配置指南
- [🚀 Vercel 部署](docs/VERCEL_DEPLOYMENT.md) - 云平台部署指南
- [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) - 深度技术架构解析
- [🔧 API文档](docs/IMPLEMENTATION_GUIDE.md#api-使用示例) - 完整的API使用示例

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

