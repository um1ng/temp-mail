# 🚀 Vercel 部署指南

> 将现代化临时邮箱服务部署到 Vercel 云平台

## 📋 部署前准备

### 1. 项目特性

**🎨 现代化界面**
- Gmail 风格的三栏邮件布局
- 明暗主题切换系统
- 完美的移动端适配
- 基于 shadcn/ui 的现代组件

**⚡ 技术架构**
- Next.js 15 + React 19
- TypeScript 完整类型安全
- Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL

### 2. 需要的云服务

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

#### 选项 C：Resend (推荐)

1. 注册 [Resend](https://resend.com)
2. 创建 API Key
3. 配置环境变量：
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=your-resend-api-key
   ```

### 步骤 3：修改项目配置

#### 更新 package.json 构建脚本

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start --port 3000"
  }
}
```

#### 确认 Next.js 配置

创建/更新 `next.config.ts`：

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // 启用 Turbopack (可选)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // 优化静态资源
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // 启用压缩
  compress: true,
  // 生产优化
  productionBrowserSourceMaps: false,
}

export default nextConfig
```

#### 创建 Vercel 配置文件

创建 `vercel.json`：

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm vercel-build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 */6 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
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

# 应用配置
ALLOWED_DOMAINS=yourdomain.com,mail.yourdomain.com
EMAIL_EXPIRATION_MINUTES=60
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# 系统配置
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 步骤 5：部署

#### 方法 A：GitHub 集成 (推荐)

1. 将代码推送到 GitHub
2. 在 Vercel 中连接 GitHub 仓库
3. 配置构建设置：
   - Framework Preset: Next.js
   - Build Command: `pnpm vercel-build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

#### 方法 B：Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel --prod
```

## ⚙️ 生产环境代码调整

### 1. 更新邮件服务

修改 `src/lib/email-service.ts`：

```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // 生产环境SMTP配置
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // 生产环境优化
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
    });
  }

  async sendTestEmail(to: string, subject: string = '测试邮件', content: string = '这是一封测试邮件'): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"临时邮箱服务" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: content,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">欢迎使用临时邮箱服务</h2>
            <p style="color: #666; line-height: 1.6;">${content}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              发送时间: ${new Date().toLocaleString('zh-CN')}
            </p>
          </div>
        `
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Test email sent successfully:', info.messageId);
      
      // 保存到数据库
      await this.receiveEmail({
        from: process.env.SMTP_USER || 'noreply@yourdomain.com',
        to,
        subject,
        text: content,
        html: mailOptions.html
      });
      
      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      return false;
    }
  }

  // 接收邮件处理
  async receiveEmail(emailData: any): Promise<void> {
    // 验证域名
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
    const isAllowedDomain = allowedDomains.some(domain => 
      emailData.to.endsWith('@' + domain.trim())
    );
    
    if (!isAllowedDomain) {
      throw new Error('Domain not allowed');
    }
    
    // 保存到数据库的逻辑
    // ...
  }
}
```

### 2. 优化主题系统

确保主题在服务端渲染时正确加载，修改 `src/app/layout.tsx`：

```typescript
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 3. 添加错误监控

安装 Sentry (可选)：

```bash
pnpm add @sentry/nextjs
```

配置 `src/lib/sentry.ts`：

```typescript
import * as Sentry from '@sentry/nextjs'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
}
```

### 4. 添加性能监控

创建 `src/lib/analytics.ts`：

```typescript
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    // 集成 Google Analytics 或其他分析工具
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties)
    }
  }
}
```

## 🔧 域名配置

### 自定义域名设置

1. **添加域名记录**
   ```
   # 主域名
   mail.yourdomain.com → cname.vercel-dns.com
   
   # 可选：www重定向
   www.mail.yourdomain.com → mail.yourdomain.com
   ```

2. **在 Vercel 中添加域名**
   - 进入项目设置
   - 添加自定义域名
   - 等待 SSL 证书自动配置

3. **更新环境变量**
   ```
   NEXT_PUBLIC_APP_URL=https://mail.yourdomain.com
   ALLOWED_DOMAINS=yourdomain.com,mail.yourdomain.com
   ```

## 📊 性能优化

### 1. 数据库连接优化

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

### 2. API 响应优化

```typescript
// 在 API 路由中添加缓存
export async function GET(request: Request) {
  const response = NextResponse.json(data)
  
  // 设置缓存头
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  
  return response
}
```

### 3. 静态资源优化

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // 压缩优化
  compress: true,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // 字体优化
  optimizeFonts: true,
  
  // 构建优化
  swcMinify: true,
  
  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}
```

## 🚀 部署后验证

### 检查清单

- [ ] 🌐 应用正常启动 (https://yourdomain.com)
- [ ] 🗄️ 数据库连接正常
- [ ] 📧 可以创建邮箱地址
- [ ] 📨 邮件发送功能正常
- [ ] 📥 邮件接收和保存正常
- [ ] 🎨 前端界面正常显示
- [ ] 🌗 主题切换功能正常
- [ ] 📱 移动端适配正常
- [ ] ⚡ 性能指标达标

### 测试命令

```bash
# 测试邮箱创建
curl -X POST https://yourdomain.com/api/addresses \
  -H "Content-Type: application/json" \
  -d '{"expirationMinutes": 60}'

# 测试邮件发送
curl -X POST https://yourdomain.com/api/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@yourdomain.com", "subject": "测试", "content": "测试内容"}'

# 测试界面响应
curl -I https://yourdomain.com
```

### 性能测试

```bash
# 使用 Lighthouse 测试
npx lighthouse https://yourdomain.com --output=json --output-path=./lighthouse-report.json

# 使用 WebPageTest
# 访问 https://www.webpagetest.org/
```

## 💡 生产环境建议

### 安全配置

1. **环境变量保护**
   ```
   # 仅在服务端使用
   DATABASE_URL=...
   SMTP_PASS=...
   
   # 客户端可访问 (NEXT_PUBLIC_ 前缀)
   NEXT_PUBLIC_APP_URL=...
   ```

2. **API 速率限制**
   ```typescript
   // 使用 rate-limiter-flexible
   import { RateLimiterMemory } from 'rate-limiter-flexible'
   
   const rateLimiter = new RateLimiterMemory({
     points: 10, // 10 requests
     duration: 60, // per 60 seconds
   })
   ```

3. **CORS 配置**
   ```typescript
   // 在 API 路由中
   const corsHeaders = {
     'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   }
   ```

### 监控和日志

1. **错误监控**
   - Sentry 错误追踪
   - Vercel Analytics
   - 自定义错误日志

2. **性能监控**
   - Core Web Vitals
   - API 响应时间
   - 数据库查询性能

3. **业务监控**
   - 邮件发送成功率
   - 用户使用统计
   - 系统资源使用

### 备份和恢复

1. **数据库备份**
   ```bash
   # 自动备份脚本
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **环境变量备份**
   - 保存环境变量配置
   - 文档化部署流程

---

**🎉 完成后，你的现代化临时邮箱服务将在 Vercel 上运行！**

✨ **部署特性**：
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS 证书
- ✅ 无服务器架构
- ✅ 自动扩展
- ✅ 零停机部署
- ✅ 现代化邮件界面
- ✅ 完美的移动端体验

**🚀 立即享受企业级的临时邮箱服务！** 