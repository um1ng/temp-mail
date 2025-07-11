# 📧 临时邮箱服务 (TempMailServer)

> **现代化的临时邮箱服务，保护您的隐私，简化邮件管理**  
> 基于 Next.js 15 + React 19 + TypeScript 构建的企业级邮件管理系统  
> 🎉 **已完成邮箱管理器全面重构，用户体验显著提升**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black?style=for-the-badge&logo=shadcnui)](https://ui.shadcn.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

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

## 🚀 最新功能更新 (2025年1月)

### 🏗️ 三层架构邮箱管理器
- **简化视图** - 新手友好的场景导向界面
- **标准视图** - 平衡的功能性与易用性
- **专家视图** - 高级用户的全功能管理界面

### 🎯 场景导向邮箱模板
- **网站注册** - 1小时有效期，自动提取验证码
- **验证码接收** - 15分钟有效期，验证码高亮
- **文件接收** - 3小时有效期，附件预览
- **订阅测试** - 12小时有效期，邮件分类
- **应用测试** - 24小时有效期，开发者模式

### ⚡ 智能化批量操作
- **批量续期** - 一键续期多个邮箱
- **批量管理** - 删除、归档、标签管理
- **数据导出** - CSV格式完整数据导出
- **操作撤销** - 误操作快速恢复

### 📱 移动端优化体验
- **滑动手势** - 左右滑动执行快捷操作
- **底部操作栏** - 移动端友好的批量操作界面
- **响应式卡片** - 完美适配所有屏幕尺寸
- **PWA支持** - 可安装到设备桌面

### 🤖 智能推荐与自动化
- **使用模式分析** - 智能分析用户使用习惯
- **个性化推荐** - 基于使用模式的功能推荐
- **自动化任务** - 定时清理、自动续期等
- **智能通知** - 过期提醒和重要通知

### 📊 高级统计与监控
- **8维度统计** - 全面的邮箱使用数据
- **实时监控** - 邮箱状态实时更新
- **趋势分析** - 使用趋势和模式识别
- **数据洞察** - 深度数据分析和建议

## 📁 项目结构

```
temp-mail/
├── 📁 src/                    # 源代码目录
│   ├── 📁 app/                # Next.js App Router
│   │   ├── 📁 api/            # API 路由
│   │   │   ├── addresses/     # 邮箱地址管理
│   │   │   ├── emails/        # 邮件管理
│   │   │   ├── analytics/     # 数据分析
│   │   │   ├── lifecycle/     # 生命周期管理
│   │   │   ├── proxy/         # 代理服务
│   │   │   ├── receive-email/ # 接收邮件
│   │   │   └── send-test-email/ # 发送测试邮件
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx          # 首页
│   │   └── globals.css       # 全局样式
│   ├── 📁 components/         # React 组件
│   │   ├── enhanced-mailbox-manager.tsx  # 增强邮箱管理器
│   │   ├── mailbox-views/     # 邮箱管理视图
│   │   │   ├── simple-view.tsx      # 简化视图
│   │   │   ├── standard-view.tsx    # 标准视图
│   │   │   └── expert-view.tsx      # 专家视图
│   │   ├── analytics-dashboard.tsx  # 分析仪表板
│   │   ├── batch-operation-toolbar.tsx # 批量操作工具栏
│   │   ├── smart-classification.tsx     # 智能分类
│   │   ├── lifecycle-management.tsx     # 生命周期管理
│   │   ├── swipeable-item.tsx           # 滑动组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── 📁 hooks/             # 自定义 React Hooks
│   │   ├── use-batch-operations.ts     # 批量操作钩子
│   │   ├── use-notifications.ts        # 通知系统钩子
│   │   ├── use-security.ts             # 安全钩子
│   │   └── use-search-optimization.ts  # 搜索优化钩子
│   ├── 📁 lib/               # 工具库和配置
│   │   ├── security.ts       # 安全工具
│   │   ├── utils.ts         # 通用工具
│   │   └── db.ts            # 数据库配置
│   └── 📁 types/            # TypeScript 类型定义
├── 📁 prisma/               # Prisma ORM
│   ├── schema.prisma        # 数据库模式
│   └── migrations/          # 数据库迁移
├── 📁 public/              # 静态资源
├── 📁 docs/                # 项目文档
│   └── FEATURE_ENHANCEMENT_PROPOSAL.md  # 功能增强文档
├── package.json            # 项目配置
├── tailwind.config.js      # Tailwind CSS 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目说明
```

## 🏗️ 技术架构

### 核心技术栈
- **前端框架**: Next.js 15 (React 19)
- **开发语言**: TypeScript 5
- **数据库**: PostgreSQL + Prisma ORM
- **样式框架**: Tailwind CSS + shadcn/ui
- **状态管理**: React Hooks + Context API
- **包管理器**: pnpm

### 创新架构特性
- **三层渐进式UI架构**: 简化/标准/专家视图
- **场景导向设计模式**: 基于使用场景的功能组织
- **智能推荐系统**: 基于用户行为的个性化推荐
- **批量操作引擎**: 高效的批量管理和撤销机制
- **移动端优化**: 手势交互和PWA支持

### 关键组件
- **EnhancedMailboxManager**: 核心邮箱管理器
- **ScenarioTemplates**: 场景模板系统
- **BatchOperations**: 批量操作系统
- **SmartRecommendations**: 智能推荐引擎
- **SwipeableItem**: 移动端滑动组件
│   └── 📁 types/             # TypeScript 类型定义
├── 📁 docs/                  # 项目文档
├── 📁 prisma/                # 数据库相关
├── 📁 public/                # 静态资源
├── docker-compose.yml        # Docker 配置
├── components.json           # shadcn/ui 配置
├── package.json              # 项目配置
├── pnpm-workspace.yaml       # pnpm 工作区配置
├── vercel.json              # Vercel 部署配置
└── README.md                # 项目说明
```

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
- **Node.js** 18+ (推荐 20+)
- **pnpm** 10+ (项目已配置)
- **Docker Desktop** (用于数据库和邮件服务)

### 🎯 一键启动

```bash
# 1. 克隆项目
git clone https://github.com/your-username/temp-mail.git
cd temp-mail

# 2. 一键设置 (推荐)
pnpm setup
```

### 📋 手动安装

```bash
# 1. 安装依赖
pnpm install

# 2. 启动 Docker 服务
pnpm docker:up

# 3. 设置数据库
pnpm db:generate
pnpm db:migrate

# 4. 启动开发服务器
pnpm dev
```

### 🎉 立即使用

**主应用**:
- 🌐 **应用地址**: http://localhost:3000
- ⚡ **使用 Turbopack** 极速热重载

**开发工具**:
- 📧 **MailHog** (邮件测试): http://localhost:8025
- 🗄️ **Adminer** (数据库管理): http://localhost:8080
- 💾 **Prisma Studio**: `pnpm db:studio`

## 🏗️ 技术架构

### 🎨 前端技术栈
- **Next.js 15** - React 框架，App Router，Turbopack
- **React 19** - 最新并发特性和 Server Components
- **TypeScript 5** - 完整类型安全
- **Tailwind CSS 4** - 最新版原子化样式框架
- **shadcn/ui** - 基于 Radix UI 的现代组件库
- **next-themes** - 主题切换系统
- **Lucide React** - 现代化图标库

### 🚀 后端技术栈
- **Prisma ORM 5** - 类型安全数据库操作
- **PostgreSQL** - 主数据库
- **Nodemailer 6** - 邮件处理引擎
- **Zod 3** - 运行时数据验证

### 🛠️ 开发工具链
- **pnpm 10** - 高性能包管理器
- **Docker Compose** - 容器化开发环境
- **ESLint 9** - 代码质量检查
- **Turbopack** - 极速构建工具
- **MailHog** - SMTP 测试服务
- **Adminer** - 数据库管理界面

### ☁️ 部署技术
- **Vercel** - 无服务器部署平台
- **Docker** - 容器化部署
- **PostgreSQL** - 生产数据库

## 📋 API 接口

### 📧 邮箱管理
```bash
# 创建临时邮箱
POST /api/addresses
Content-Type: application/json

# 获取邮箱列表
GET /api/addresses

# 删除邮箱
DELETE /api/addresses/{id}
```

### 📨 邮件管理
```bash
# 获取邮件列表
GET /api/emails?emailAddressId={id}

# 获取邮件详情
GET /api/emails/{id}

# 标记为已读
PATCH /api/emails/{id}
Content-Type: application/json
{ "isRead": true }

# 删除邮件
DELETE /api/emails/{id}
```

### 🔧 邮件服务
```bash
# 接收邮件 (Webhook)
POST /api/receive-email
Content-Type: application/json

# 发送测试邮件
POST /api/send-test-email
Content-Type: application/json
{
  "to": "test@tempmail.local",
  "subject": "测试邮件",
  "body": "这是一封测试邮件"
}
```

## ⚙️ 配置

### 🌍 环境变量
```env
# 数据库配置
DATABASE_URL="postgresql://tempmail_user:tempmail_pass@localhost:5432/tempmail_db"

# 邮箱配置
ALLOWED_DOMAINS="tempmail.local,10minutemail.local,guerrillamail.local"
EMAIL_EXPIRATION_MINUTES=60

# SMTP 配置
SMTP_HOST=localhost
SMTP_PORT=1025

# Next.js 配置
NODE_ENV=development
PORT=3000
```

### 🎮 常用命令
```bash
# 📦 开发相关
pnpm dev              # 启动开发服务器 (Turbopack)
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # ESLint 代码检查

# 🗄️ 数据库相关
pnpm db:generate      # 生成 Prisma 客户端
pnpm db:migrate       # 运行数据库迁移
pnpm db:deploy        # 部署迁移到生产环境
pnpm db:studio        # 打开 Prisma Studio
pnpm db:reset         # 重置数据库

# 🐳 Docker 相关
pnpm docker:up        # 启动 Docker 服务
pnpm docker:down      # 停止 Docker 服务
pnpm docker:logs      # 查看容器日志
pnpm docker:clean     # 清理容器和数据

# 🚀 特殊命令
pnpm setup            # 一键环境设置
pnpm vercel-build     # Vercel 构建命令
```

## 🎯 使用场景

### 👤 个人用户
- 🛡️ **隐私保护** - 避免主邮箱被骚扰
- 📝 **快速注册** - 临时账号注册验证
- 🧪 **服务测试** - 测试邮件发送功能
- 🎨 **界面美观** - 现代化的邮件管理体验

### 👨‍💻 开发团队
- ⚡ **API 测试** - 完整的邮件API
- 🔧 **开发调试** - 本地SMTP测试环境
- 📊 **数据管理** - 可视化数据库界面
- 🎯 **UI/UX 参考** - 现代化界面设计

### 🏢 企业用户
- 🔍 **邮件监控** - 批量邮件测试
- 📈 **性能测试** - 邮件系统压力测试
- 🔒 **安全测试** - 邮件安全验证
- 📋 **集成测试** - 第三方服务集成

## 💡 技术亮点

### 🎨 现代化 UI/UX
- **shadcn/ui** - 基于 Radix UI 的组件系统
- **Tailwind CSS 4** - 最新版本，更好的性能
- **Gmail 风格** - 熟悉的三栏邮件布局
- **主题系统** - 浅色/深色/系统主题
- **响应式设计** - 完美适配各种设备
- **动画效果** - 平滑的交互体验

### 🚀 性能优化
- **Turbopack** - 比 Webpack 快 10 倍的构建工具
- **React 19** - 最新并发特性和 Server Components
- **pnpm** - 比 npm 快 2 倍的包管理器
- **PostgreSQL** - 高性能关系型数据库
- **Prisma** - 类型安全的 ORM

### 🔧 开发体验
- **TypeScript** - 完整类型安全
- **ESLint** - 代码质量保证
- **Docker** - 一致的开发环境
- **热重载** - Turbopack 极速开发
- **自动部署** - Vercel 无缝集成

## 🔧 故障排除

### ❗ 常见问题

**🚫 服务启动失败**
```bash
# 检查端口占用
lsof -i :3000

# 重启 Docker 服务
pnpm docker:clean
pnpm docker:up

# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**🗄️ 数据库连接错误**
```bash
# 检查容器状态
docker-compose ps

# 重置数据库
pnpm db:reset

# 重新生成客户端
pnpm db:generate
```

**🎨 UI 显示异常**
```bash
# 清除 Next.js 缓存
rm -rf .next

# 重新构建
pnpm dev
```

**📦 依赖问题**
```bash
# 清理并重新安装
pnpm store prune
pnpm install --frozen-lockfile
```

**🐳 Docker 问题**
```bash
# 完全清理并重启
pnpm docker:clean
docker system prune -a
pnpm docker:up
```

## 🚀 部署

### ☁️ Vercel 部署 (推荐)
1. 推送代码到 GitHub
2. 连接 Vercel 项目
3. 配置环境变量
4. 自动部署完成

### 🐳 Docker 部署
```bash
# 构建镜像
docker build -t temp-mail .

# 运行容器
docker run -p 3000:3000 temp-mail
```

### 🏗️ 传统部署
```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

## 📖 文档

### 📚 完整文档导航

#### 🏃‍♂️ 快速开始
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - 详细的安装配置和功能指南
- [🚀 Vercel部署指南](docs/VERCEL_DEPLOYMENT.md) - 云平台部署和生产环境配置

#### 🏗️ 技术文档
- [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) - 深度技术架构解析和组件分析
- [🧪 API测试结果](docs/API_TEST_RESULTS.md) - 完整的API测试报告和性能分析

### 🔍 按角色查看文档

**🧑‍💼 产品经理/项目经理**
- 本文档 - 了解产品功能和特性
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - 了解用户功能和操作流程

**👨‍💻 前端开发者**
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - UI组件开发指南
- [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) - 前端技术栈详解

**👨‍💻 后端开发者**
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - API开发和配置
- [🧪 API测试结果](docs/API_TEST_RESULTS.md) - API接口规范和测试
- [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) - 后端技术架构

**🔧 运维工程师**
- [🚀 Vercel部署指南](docs/VERCEL_DEPLOYMENT.md) - 生产环境部署
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - 故障排除和运维
- [🧪 API测试结果](docs/API_TEST_RESULTS.md) - 性能监控和优化

**🧪 QA工程师**
- [🧪 API测试结果](docs/API_TEST_RESULTS.md) - 测试用例和结果
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - 功能测试指南

**🏗️ 架构师**
- [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) - 完整技术架构
- [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) - 项目架构说明

### 🎯 按任务查看文档

**🚀 初次部署**
1. 本文档 → 快速开始
2. [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) → 环境准备
3. [🚀 Vercel部署指南](docs/VERCEL_DEPLOYMENT.md) → 生产部署

**🔧 功能开发**
1. [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) → UI组件架构
2. [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) → 组件开发指南
3. [🧪 API测试结果](docs/API_TEST_RESULTS.md) → API规范

**🐛 问题排查**
1. [📋 实施指南](docs/IMPLEMENTATION_GUIDE.md) → 故障排除
2. 本文档 → 常见问题
3. [🧪 API测试结果](docs/API_TEST_RESULTS.md) → 性能分析

**🚀 性能优化**
1. [🧪 API测试结果](docs/API_TEST_RESULTS.md) → 性能测试结果
2. [📊 技术栈分析](docs/TECH_STACK_ANALYSIS.md) → 优化建议
3. [🚀 Vercel部署指南](docs/VERCEL_DEPLOYMENT.md) → 性能优化

### 📈 文档统计

| 文档 | 主要内容 | 适用人群 |
|------|----------|----------|
| 📋 本项目介绍 | 产品特性、快速开始、API接口 | 所有用户 |
| 📋 实施指南 | 详细配置、组件开发、故障排除 | 开发者、运维 |
| 📊 技术栈分析 | 架构设计、技术选型、性能评估 | 架构师、开发者 |
| 🧪 API测试结果 | 接口测试、性能分析、安全测试 | QA、后端开发 |
| 🚀 Vercel部署 | 生产部署、性能优化、运维监控 | 运维、DevOps |

**总计**: 约3,000行文档，涵盖项目开发、测试、部署的完整流程

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

