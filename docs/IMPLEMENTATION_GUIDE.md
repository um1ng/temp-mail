# 临时邮箱服务实施指南

> 📅 更新时间：2025年1月  
> 🎯 状态：生产就绪  
> 🎨 新增：邮件风格界面 + 主题系统

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/your-username/temp-mail.git
cd temp-mail

# 快速设置 (推荐)
pnpm setup

# 或者手动安装
pnpm install
docker-compose up -d
npx prisma generate
npx prisma migrate dev
pnpm dev
```

### 2. 访问应用

- **主应用**: http://localhost:3000
- **邮件管理**: http://localhost:8025 (MailHog)
- **数据库管理**: http://localhost:8080 (Adminer)

## 🎨 新功能亮点

### 📧 邮件风格界面
- **三栏布局** - 类似 Gmail 的现代化设计
- **侧边栏导航** - 邮箱管理、快速操作
- **邮件列表** - 现代化的邮件概览
- **详情面板** - 完整的邮件查看体验

### 🌗 主题系统
- **多主题支持** - 浅色/深色/系统主题
- **平滑切换** - 无闪烁的主题过渡
- **状态持久化** - 记住用户的主题选择
- **响应式适配** - 完美适配各种设备

### 📱 用户体验优化
- **移动端适配** - 自适应布局，触摸友好
- **快速操作** - 一键复制、发送测试邮件
- **实时反馈** - 操作状态和结果提示
- **键盘导航** - 支持快捷键操作

## 🏗️ 项目架构

### 核心组件

**前端 (Next.js 15 + React 19)**
- 🎨 **现代化界面** - Gmail 风格的邮件布局
- 🌗 **主题系统** - 明暗模式无缝切换
- 📱 **响应式设计** - 完美适配各种设备
- ⚡ **性能优化** - 快速加载和响应

**UI 组件系统**
- 🎯 **shadcn/ui** - 现代化组件库
- 🔧 **Radix UI** - 无障碍组件基础
- 🎨 **Tailwind CSS** - 原子化样式
- 📦 **优化依赖** - 精简的包体积

**后端 API**
- `POST /api/addresses` - 创建临时邮箱
- `GET /api/emails` - 获取邮件列表
- `PATCH /api/emails/[id]` - 更新邮件状态
- `DELETE /api/emails/[id]` - 删除邮件
- `POST /api/receive-email` - 接收外部邮件
- `POST /api/send-test-email` - 发送测试邮件

**数据层**
- PostgreSQL 数据库
- Prisma ORM 类型安全操作
- 自动过期清理机制

### 服务架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │    │    MailHog      │
│  (Frontend/API) │────│   (Database)    │    │ (SMTP Testing)  │
│   + UI System   │    │   + Prisma      │    │   + Adminer     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                            ┌─────────────────┐
                            │      Redis      │
                            │   (Optional)    │
                            └─────────────────┘
```

## ⚙️ 配置说明

### 环境变量 (.env)

```env
# 数据库
DATABASE_URL="postgresql://tempmail_user:tempmail_pass@localhost:5432/tempmail_db"

# 邮件设置
ALLOWED_DOMAINS="tempmail.local,10minutemail.local,guerrillamail.local"
EMAIL_EXPIRATION_MINUTES=60

# SMTP 配置
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false

# 可选配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Docker 服务

```yaml
services:
  postgres:    # 数据库 (端口 5432)
  redis:       # 缓存 (端口 6379)
  mailhog:     # SMTP (端口 1025) + UI (端口 8025)
  adminer:     # 数据库管理 (端口 8080)
```

## 📋 API 使用示例

### 创建邮箱地址

```bash
curl -X POST http://localhost:3000/api/addresses \
  -H "Content-Type: application/json" \
  -d '{"expirationMinutes": 60}'
```

**响应示例**:
```json
{
  "success": true,
  "emailAddress": {
    "id": "clx...",
    "address": "random123@tempmail.local",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T01:00:00.000Z"
  }
}
```

### 获取邮件列表

```bash
curl "http://localhost:3000/api/emails?emailAddressId=clx..."
```

**响应示例**:
```json
{
  "success": true,
  "emails": [
    {
      "id": "clx...",
      "fromAddress": "sender@example.com",
      "subject": "欢迎使用临时邮箱",
      "textContent": "这是邮件内容...",
      "receivedAt": "2025-01-01T00:00:00.000Z",
      "isRead": false
    }
  ]
}
```

### 发送测试邮件

```bash
curl -X POST http://localhost:3000/api/send-test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@tempmail.local",
    "subject": "测试邮件",
    "content": "这是测试内容"
  }'
```

## 🎯 用户功能指南

### 邮箱管理
1. **生成邮箱** - 点击"生成新邮箱"按钮
2. **复制地址** - 点击复制按钮或邮箱地址
3. **发送测试** - 点击"发送测试邮件"验证功能
4. **自动刷新** - 开启自动刷新（每10秒）

### 邮件操作
1. **查看邮件** - 点击邮件列表中的邮件
2. **标记已读** - 点击邮件自动标记为已读
3. **删除邮件** - 点击删除按钮或使用右键菜单
4. **邮件搜索** - 使用顶部搜索框查找邮件

### 主题切换
1. **切换主题** - 点击右上角主题按钮
2. **选择模式** - 浅色/深色/系统主题
3. **自动跟随** - 系统主题自动跟随系统设置

### 响应式体验
1. **桌面端** - 完整的三栏布局
2. **移动端** - 自适应单栏显示
3. **触摸操作** - 优化的移动端交互

## 🔧 开发任务

### 项目命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 代码质量检查

# 数据库
pnpm db:generate      # 生成 Prisma 客户端
pnpm db:migrate       # 运行数据库迁移
pnpm db:studio        # 打开数据库浏览器
pnpm db:reset         # 重置数据库
pnpm db:deploy        # 部署到生产环境

# Docker
pnpm docker:up        # 启动 Docker 服务
pnpm docker:down      # 停止 Docker 服务
pnpm docker:logs      # 查看容器日志
pnpm docker:clean     # 清理 Docker 资源

# 快速设置
pnpm setup            # 一键环境搭建
```

### 组件开发

```bash
# 添加新的 shadcn/ui 组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast

# 自定义组件开发
src/components/ui/          # shadcn/ui 组件
src/components/email-*      # 邮件相关组件
src/components/theme-*      # 主题相关组件
```

## 🎨 UI 组件指南

### 已实现组件

**核心组件**
- `Button` - 按钮组件，支持多种变体
- `Input` - 输入框，表单控件
- `Card` - 卡片容器
- `Badge` - 徽章标签
- `Avatar` - 头像组件

**布局组件**
- `EmailLayout` - 主布局容器
- `EmailSidebar` - 侧边栏导航
- `Sheet` - 抽屉组件（移动端）
- `Separator` - 分割线

**交互组件**
- `EmailList` - 邮件列表
- `EmailDetail` - 邮件详情
- `DropdownMenu` - 下拉菜单
- `ThemeToggle` - 主题切换

### 组件使用示例

```typescript
// 基本按钮
<Button onClick={handleClick}>
  点击我
</Button>

// 邮件列表
<EmailList
  emails={emails}
  selectedEmailId={selectedId}
  onEmailSelect={handleSelect}
  onEmailDelete={handleDelete}
/>

// 主题切换
<ThemeToggle />

// 响应式布局
<EmailLayout>
  <div className="flex flex-1 overflow-hidden">
    <div className="w-1/3 border-r">
      <EmailList />
    </div>
    <div className="flex-1">
      <EmailDetail />
    </div>
  </div>
</EmailLayout>
```

## 🔍 故障排除

### 常见问题

**UI 显示异常**
```bash
# 清除缓存
rm -rf .next node_modules
pnpm install
pnpm dev
```

**主题切换失败**
```bash
# 检查主题配置
npm ls next-themes
# 重新安装主题依赖
pnpm add next-themes
```

**组件样式问题**
```bash
# 检查 Tailwind CSS 配置
npx tailwindcss build
# 重新生成样式
pnpm build
```

**数据库连接失败**
```bash
# 重启数据库容器
docker-compose restart postgres
# 重新生成客户端
pnpm db:generate
```

**SMTP 发送失败**
```bash
# 检查 MailHog 状态
docker logs tempmail-mailhog
# 访问管理界面
open http://localhost:8025
```

## 🚀 部署准备

### 生产环境配置

1. **环境变量设置**
   ```env
   # 生产数据库
   DATABASE_URL="postgresql://..."
   
   # 真实 SMTP 服务
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # 域名配置
   ALLOWED_DOMAINS="yourdomain.com"
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **性能优化**
   - 启用数据库连接池
   - 配置 Redis 缓存
   - 设置 CDN 加速
   - 监控系统资源

3. **安全设置**
   - 限制 API 访问频率
   - 配置 CORS 策略
   - 启用请求日志
   - 设置 HTTPS 证书

### 部署脚本

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 或使用 PM2
pm2 start ecosystem.config.js
```

## 📊 性能监控

### 关键指标

**前端性能**
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 首次输入延迟 (FID)
- 累积布局偏移 (CLS)

**后端性能**
- API 响应时间
- 数据库查询性能
- 邮件发送成功率
- 内存使用情况

### 监控工具

```bash
# 本地性能测试
npm run build
npm run start
lighthouse http://localhost:3000

# 生产监控
vercel analytics
sentry error tracking
```

---

**🎉 项目已完全实现现代化邮件界面！** 

✨ **新增特性**:
- 📧 Gmail 风格的三栏布局
- 🌗 明暗主题切换系统
- 📱 完美的移动端适配
- 🎨 现代化的 UI 组件

**所有功能经过测试验证，可立即部署到生产环境。** 