# 临时邮箱服务重构实施指南

## 🚀 快速开始

### 1. 安装依赖

首先安装重构所需的依赖包：

```bash
# 安装后端依赖
pnpm add prisma @prisma/client
pnpm add zod
pnpm add nodemailer @types/nodemailer
pnpm add @tanstack/react-query
pnpm add zustand

# 安装开发依赖
pnpm add -D prisma
```

### 2. 启动开发环境

启动数据库和邮件服务：

```bash
# 启动 Docker 服务
docker-compose up -d

# 验证服务状态
docker-compose ps
```

服务启动后可访问：
- **MailHog Web UI**: http://localhost:8025 (查看接收的邮件)
- **Adminer**: http://localhost:8080 (数据库管理)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，确保数据库连接信息正确：

```env
DATABASE_URL="postgresql://tempmail_user:tempmail_pass@localhost:5432/tempmail_db"
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
ALLOWED_DOMAINS=tempmail.local,10minutemail.local
EMAIL_EXPIRATION_MINUTES=60
```

### 4. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建数据库迁移
npx prisma migrate dev --name init

# 查看数据库结构
npx prisma studio
```

### 5. 创建邮件接收服务

创建 `src/lib/email-service.ts`：

```typescript
import nodemailer from 'nodemailer';
import { db } from './db';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }

  async receiveEmail(emailData: {
    from: string;
    to: string;
    subject?: string;
    text?: string;
    html?: string;
  }) {
    try {
      // 查找目标邮箱地址
      const emailAddress = await db.emailAddress.findUnique({
        where: { address: emailData.to, isActive: true },
      });

      if (!emailAddress || emailAddress.expiresAt < new Date()) {
        console.log(`Email address ${emailData.to} not found or expired`);
        return false;
      }

      // 保存邮件到数据库
      const email = await db.email.create({
        data: {
          emailAddressId: emailAddress.id,
          fromAddress: emailData.from,
          toAddress: emailData.to,
          subject: emailData.subject,
          textContent: emailData.text,
          htmlContent: emailData.html,
          hasAttachments: false,
        },
      });

      console.log(`Email saved: ${email.id}`);
      return true;
    } catch (error) {
      console.error('Error receiving email:', error);
      return false;
    }
  }
}
```

### 6. 更新前端组件

修改 `src/app/page.tsx` 使用真实 API：

```typescript
// 替换模拟的邮箱生成函数
const generateEmail = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expirationMinutes: 60 }),
    });
    
    if (!response.ok) throw new Error('Failed to generate email');
    
    const data = await response.json();
    setCurrentEmail(data.emailAddress.address);
    setCurrentAddressId(data.emailAddress.id);
    setEmails([]);
    toast.success("新邮箱地址已生成");
  } catch (error) {
    toast.error("生成邮箱地址失败");
  } finally {
    setIsLoading(false);
  }
};

// 替换模拟的邮件刷新函数
const refreshEmails = async () => {
  if (!currentAddressId) return;
  
  setIsLoading(true);
  try {
    const response = await fetch(`/api/emails?emailAddressId=${currentAddressId}`);
    if (!response.ok) throw new Error('Failed to fetch emails');
    
    const data = await response.json();
    setEmails(data.emails);
    toast.success("邮件已刷新");
  } catch (error) {
    toast.error("刷新邮件失败");
  } finally {
    setIsLoading(false);
  }
};
```

## 🧪 测试重构结果

### 1. 启动应用

```bash
pnpm dev
```

### 2. 测试邮箱生成

1. 访问 http://localhost:3000
2. 点击"生成新邮箱"按钮
3. 检查是否成功生成邮箱地址

### 3. 测试邮件发送

使用 MailHog 发送测试邮件：

```bash
# 使用 curl 发送测试邮件
curl -X POST http://localhost:8025/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "你的临时邮箱地址",
    "subject": "测试邮件",
    "body": "这是一封测试邮件"
  }'
```

或者访问 MailHog Web UI (http://localhost:8025) 手动发送邮件。

### 4. 验证邮件接收

1. 在前端点击"刷新"按钮
2. 检查是否显示接收到的邮件
3. 测试邮件的读取、删除等功能

## 🔧 故障排除

### 数据库连接问题

```bash
# 检查 Docker 服务状态
docker-compose ps

# 查看数据库日志
docker-compose logs postgres

# 重启数据库服务
docker-compose restart postgres
```

### Prisma 相关问题

```bash
# 重新生成客户端
npx prisma generate

# 重置数据库
npx prisma migrate reset

# 查看数据库状态
npx prisma db pull
```

### 邮件服务问题

```bash
# 查看 MailHog 日志
docker-compose logs mailhog

# 测试 SMTP 连接
telnet localhost 1025
```

## 📈 性能优化建议

### 1. 数据库索引

```sql
-- 为常用查询添加索引
CREATE INDEX idx_emails_address_received ON emails(email_address_id, received_at DESC);
CREATE INDEX idx_email_addresses_active ON email_addresses(is_active, expires_at);
```

### 2. Redis 缓存

```typescript
// 缓存邮箱地址查询
const cachedAddress = await redis.get(`email:${address}`);
if (cachedAddress) {
  return JSON.parse(cachedAddress);
}
```

### 3. 分页查询

```typescript
// 实现cursor-based分页
const emails = await db.email.findMany({
  where: { emailAddressId },
  orderBy: { receivedAt: 'desc' },
  take: 20,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
});
```

## 🚀 部署到生产环境

### 1. 环境变量配置

```env
NODE_ENV=production
DATABASE_URL="你的生产数据库URL"
SMTP_HOST=你的SMTP服务器
ALLOWED_DOMAINS=你的域名.com
```

### 2. 构建和部署

```bash
# 构建应用
pnpm build

# 启动生产服务
pnpm start
```

### 3. 数据库迁移

```bash
# 生产环境数据库迁移
npx prisma migrate deploy
```

## 📝 后续改进

1. **实时通知**: 实现 WebSocket 推送新邮件
2. **邮件搜索**: 添加全文搜索功能
3. **附件支持**: 实现文件附件的上传和下载
4. **邮件转发**: 支持邮件转发到真实邮箱
5. **API 限流**: 防止滥用和攻击
6. **监控告警**: 添加应用性能监控

通过以上步骤，您的临时邮箱服务将从模拟数据转换为真实可用的邮件服务！ 