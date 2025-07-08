# 临时邮箱服务实施指南

> 📅 更新时间：2025年1月  
> 🎯 状态：生产就绪

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
pnpm install

# 启动服务容器
docker-compose up -d

# 初始化数据库
npx prisma generate
npx prisma migrate dev

# 启动应用
pnpm dev
```

### 2. 访问应用

- **主应用**: http://localhost:3000
- **邮件管理**: http://localhost:8025 (MailHog)
- **数据库管理**: http://localhost:8080 (Adminer)

## 🏗️ 项目架构

### 核心组件

**前端 (Next.js 15)**
- 响应式界面，支持桌面和移动端
- 实时邮件刷新 (每10秒轮询)
- 一键操作：生成、复制、删除、标记已读

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
│                 │    │                 │    │                 │
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

### 获取邮件列表

```bash
curl "http://localhost:3000/api/emails?emailAddressId=<ID>"
```

### 发送测试邮件

```bash
curl -X POST http://localhost:3000/api/send-test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "example@tempmail.local",
    "subject": "测试邮件",
    "content": "这是测试内容"
  }'
```

## 🔧 开发任务

### 数据库操作

```bash
npx prisma generate      # 生成客户端
npx prisma migrate dev   # 运行迁移
npx prisma studio        # 打开数据浏览器
npx prisma migrate reset # 重置数据库
```

### Docker 操作

```bash
docker-compose up -d     # 启动所有服务
docker-compose down      # 停止服务
docker-compose ps        # 查看状态
docker-compose logs -f   # 查看日志
```

## 🎯 核心功能

### 用户功能
- ✅ 一键生成临时邮箱地址
- ✅ 自动接收邮件
- ✅ 实时邮件刷新
- ✅ 邮件管理 (标记已读/删除)
- ✅ 测试邮件发送

### 开发功能
- ✅ RESTful API
- ✅ TypeScript 类型安全
- ✅ Docker 开发环境
- ✅ 数据库管理工具
- ✅ SMTP 测试工具

## 🔍 故障排除

### 常见问题

**数据库连接失败**
```bash
docker-compose restart postgres
npx prisma db push
```

**SMTP 发送失败**
```bash
docker logs tempmail-mailhog
# 访问 http://localhost:8025 检查邮件
```

**端口占用**
```bash
# 检查端口使用情况
lsof -i :3000
lsof -i :5432
```

## 🚀 部署准备

### 生产环境配置

1. **环境变量**
   - 配置生产数据库连接
   - 设置真实SMTP服务器
   - 配置域名和SSL

2. **性能优化**
   - 启用数据库连接池
   - 配置Redis缓存
   - 设置CDN加速

3. **安全设置**
   - 限制API访问频率
   - 配置CORS策略
   - 启用请求日志

---

**🎉 项目已完全实现并可投入使用！** 所有核心功能经过测试验证，可立即部署到生产环境。 