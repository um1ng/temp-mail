# 🚀 Vercel 部署指南

> 将临时邮箱服务部署到 Vercel 云平台

## 📋 部署前准备

### 1. 需要的云服务

**数据库选择** (选择其一)：
- ✅ **Vercel Postgres** - 最简单集成
- ✅ **Supabase** - 功能丰富的 PostgreSQL
- ✅ **PlanetScale** - 无服务器 MySQL
- ✅ **Neon** - 现代 PostgreSQL

**SMTP 服务选择** (选择其一)：
- ✅ **Gmail SMTP** - 免费，每日 500 封邮件
- ✅ **SendGrid** - 每月 100 封免费邮件
- ✅ **Resend** - 现代邮件 API
- ✅ **Amazon SES** - 成本低廉

## 🛠️ 部署步骤

### 步骤 1：设置数据库

#### 选项 A：Vercel Postgres (推荐)

1. 在 Vercel Dashboard 中创建 PostgreSQL 数据库
2. 获取连接字符串
3. 在项目中添加环境变量：
   ```
   DATABASE_URL="postgres://username:password@hostname:port/database?sslmode=require"
   ```

#### 选项 B：Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 在 Settings > Database 获取连接字符串
4. 添加环境变量：
   ```
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   ```

### 步骤 2：配置 SMTP 服务

#### 选项 A：Gmail SMTP

1. 开启 Gmail 两步验证
2. 生成应用专用密码
3. 配置环境变量：
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

#### 选项 B：SendGrid

1. 注册 [SendGrid](https://sendgrid.com)
2. 创建 API Key
3. 配置环境变量：
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### 步骤 3：修改项目配置

#### 更新 package.json 构建脚本

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

#### 创建 prisma/schema.prisma 生产配置

确保数据库 URL 支持连接池：

```prisma
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // 可选：用于迁移
}
```

### 步骤 4：Vercel 环境变量配置

在 Vercel Dashboard 中设置以下环境变量：

```bash
# 必需变量
DATABASE_URL=your-database-connection-string
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# 可选变量
ALLOWED_DOMAINS=tempmail.yourdomain.com,test.yourdomain.com
EMAIL_EXPIRATION_MINUTES=60
NODE_ENV=production
```

### 步骤 5：部署

#### 方法 A：GitHub 集成

1. 将代码推送到 GitHub
2. 在 Vercel 中连接 GitHub 仓库
3. 自动部署

#### 方法 B：Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

## ⚙️ 代码调整

### 1. 移除 MailHog 特殊处理

更新 `src/lib/email-service.ts`：

```typescript
async sendTestEmail(to: string, subject: string = '测试邮件', content: string = '这是一封测试邮件'): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@yourdomain.com',
      to,
      subject,
      text: content,
      html: `<p>${content}</p><p><small>发送时间: ${new Date().toLocaleString()}</small></p>`
    };
    
    const info = await this.transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', info.messageId);
    
    // 保存到数据库
    const emailData = {
      from: process.env.SMTP_USER || 'noreply@yourdomain.com',
      to,
      subject,
      text: content,
      html: mailOptions.html
    };
    
    await this.receiveEmail(emailData);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}
```

### 2. 更新域名验证

在生产环境中使用真实域名：

```typescript
// 在 send-test-email API 中
const isOurDomain = process.env.ALLOWED_DOMAINS?.split(',').some(domain => 
  to.endsWith('@' + domain.trim())
) || false;
```

### 3. 添加数据库迁移

创建 `scripts/migrate.js`：

```javascript
const { exec } = require('child_process');

async function migrate() {
  if (process.env.NODE_ENV === 'production') {
    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
      if (error) {
        console.error('Migration failed:', error);
        process.exit(1);
      }
      console.log('Migration completed:', stdout);
    });
  }
}

migrate();
```

## 🔧 域名配置

### 自定义域名设置

1. 在域名提供商设置 CNAME 记录：
   ```
   mail.yourdomain.com → cname.vercel-dns.com
   ```

2. 在 Vercel 中添加自定义域名

3. 更新 MX 记录指向邮件服务（如果需要接收真实邮件）

## 📊 性能优化

### 1. 数据库连接池

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### 2. API 响应缓存

```typescript
// 在 API 路由中添加缓存头
export async function GET() {
  const response = NextResponse.json(data);
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return response;
}
```

## 🚀 部署后验证

### 检查清单

- [ ] 应用正常启动
- [ ] 数据库连接正常
- [ ] 可以创建邮箱地址
- [ ] 邮件发送功能正常
- [ ] 邮件接收和保存正常
- [ ] 前端界面正常显示

### 测试命令

```bash
# 测试邮箱创建
curl -X POST https://your-app.vercel.app/api/addresses \
  -H "Content-Type: application/json" \
  -d '{"expirationMinutes": 60}'

# 测试邮件发送
curl -X POST https://your-app.vercel.app/api/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@yourdomain.com", "subject": "测试", "content": "测试内容"}'
```

## 💡 生产环境建议

### 安全配置

- 启用 CORS 限制
- 设置速率限制
- 使用环境变量保护敏感信息
- 定期清理过期邮件

### 监控和日志

- 使用 Vercel Analytics
- 设置错误监控 (Sentry)
- 配置日志记录

---

**🎉 完成后，你的临时邮箱服务将在 Vercel 上运行，支持：**

- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 无服务器架构
- ✅ 自动扩展
- ✅ 零停机部署 