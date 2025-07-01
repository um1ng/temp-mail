# 临时邮箱服务实施指南

> 📅 更新时间：2024年12月  
> 🔄 状态检查时间：2024年12月24日
> 
> 本指南基于项目**真实状态**编写，明确标注了已完成和待完成的部分。

## 📊 项目完成状态（基于实际检查）

### ✅ 已完成部分 (约 45%)

- [x] **数据库架构设计** - Prisma Schema 定义完整（EmailAddress、Email、Attachment）
- [x] **数据库迁移文件** - 已生成初始迁移 `20250624142109_init`
- [x] **Docker 环境配置** - PostgreSQL、Redis、MailHog、Adminer 配置就绪
- [x] **核心后端 API 实现**
  - [x] `/api/addresses` - 邮箱地址创建和查询 (POST/GET)
  - [x] `/api/emails` - 邮件列表获取（支持分页）
  - [x] `/api/emails/[id]` - 单个邮件操作（查看/更新/删除）
- [x] **TypeScript 类型定义** - 完整的类型系统
- [x] **UI 组件集成** - Shadcn UI 组件库配置完成
- [x] **前端界面设计** - 响应式界面布局

### ❌ 待完成部分 (约 55%)

- [ ] **⚠️ 邮件接收服务** - `src/lib/email-service.ts` **已删除，需重新实现**
- [ ] **⚠️ 前后端集成** - 前端仍使用模拟数据，**未调用真实API**
- [ ] **⚠️ 环境变量配置** - `.env` 文件状态未确认
- [ ] **⚠️ 数据库连接** - PostgreSQL 数据库需要启动和连接
- [ ] **邮件接收API** - `/api/receive-email` 不存在
- [ ] **测试邮件API** - `/api/send-test-email` 不存在
- [ ] **SMTP 集成** - 邮件接收逻辑未实现
- [ ] **实时通知** - WebSocket/轮询功能

## 🚨 关键发现

### 前端状态
- **前端仍在使用完全模拟的数据**
- `generateEmail()` 函数只是本地生成随机字符串
- `refreshEmails()` 函数返回硬编码的假邮件
- **没有任何真实的API调用**

### 后端状态  
- 核心CRUD API已实现并可用
- 缺少邮件服务层实现
- 缺少邮件接收和发送功能

## 🚀 快速开始

### 1. 安装依赖

项目依赖已在 `package.json` 中定义：

```bash
# 安装所有依赖
pnpm install
```

### 2. 启动开发环境

需要启动Docker服务：

```bash
# 启动 Docker 服务（需要Docker Desktop运行）
docker-compose up -d

# 验证服务状态
docker-compose ps
```

### 3. 配置环境变量 ⚠️ **需要验证**

检查或创建 `.env` 文件：

```bash
# 检查当前配置
cat .env

# 如果不存在或不正确，创建正确的配置
echo 'DATABASE_URL="postgresql://tempmail_user:tempmail_pass@localhost:5432/tempmail_db"
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
ALLOWED_DOMAINS=tempmail.local,10minutemail.local,guerrillamail.local
EMAIL_EXPIRATION_MINUTES=60' > .env
```

### 4. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移（如果数据库连接正常）
npx prisma migrate deploy

# （可选）查看数据库结构
npx prisma studio
```

### 5. 创建邮件接收服务 ⚠️ **必须重新实现**

需要重新创建 `src/lib/email-service.ts`：

```typescript
import nodemailer from 'nodemailer';
import { db } from './db';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
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
          subject: emailData.subject || '(无主题)',
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

export const emailService = new EmailService();
```

### 6. 更新前端组件 ⚠️ **必须重新实现**

当前前端**完全使用模拟数据**，需要完全重写以调用真实API。

替换 `src/app/page.tsx` 中的以下函数：

```typescript
// 替换当前的模拟邮箱生成函数
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
    console.error('Error generating email:', error);
    toast.error("生成邮箱地址失败");
  } finally {
    setIsLoading(false);
  }
};

// 替换当前的模拟邮件刷新函数
const refreshEmails = async () => {
  if (!currentAddressId) return;
  
  setIsLoading(true);
  try {
    const response = await fetch(`/api/emails?emailAddressId=${currentAddressId}`);
    if (!response.ok) throw new Error('Failed to fetch emails');
    
    const data = await response.json();
    // 转换API返回的数据格式
    const formattedEmails: Email[] = data.emails.map((email: any) => ({
      id: email.id,
      from: email.fromAddress,
      subject: email.subject || '(无主题)',
      content: email.textContent || email.htmlContent || '(无内容)',
      timestamp: new Date(email.receivedAt),
      isRead: email.isRead
    }));
    
    setEmails(formattedEmails);
    toast.success(`邮件已刷新 (${formattedEmails.length} 封)`);
  } catch (error) {
    console.error('Error fetching emails:', error);
    toast.error("刷新邮件失败");
  } finally {
    setIsLoading(false);
  }
};
```

## 📍 当前项目真实状态

### ✅ 可以直接使用的功能
1. **数据库模式** - 已定义且可用
2. **后端API** - 核心CRUD操作已实现
3. **前端界面** - UI组件完整，但使用模拟数据

### ⚠️ 需要立即修复的问题
1. **前端集成** - 必须将模拟数据替换为真实API调用
2. **邮件服务** - 必须重新实现 EmailService 类
3. **数据库连接** - 需要确保PostgreSQL正常运行
4. **环境配置** - 需要验证 .env 文件内容

### 🚧 需要新增的功能
1. **邮件接收API** - 用于外部邮件接收
2. **测试邮件API** - 用于发送测试邮件
3. **实时更新** - 邮件实时推送功能

## 🎯 快速完成指南

**如果您想让项目立即可用，请按以下顺序执行：**

### 第一步：确保环境正常
```bash
# 1. 检查Docker是否运行
docker-compose up -d postgres

# 2. 验证数据库连接
npx prisma db push
```

### 第二步：重新实现邮件服务
创建 `src/lib/email-service.ts`（代码见上方第5步）

### 第三步：修复前端集成
更新 `src/app/page.tsx`，替换所有模拟函数为真实API调用（代码见上方第6步）

### 第四步：测试
```bash
pnpm dev
# 访问 http://localhost:3000 测试完整流程
```

---

**⚠️ 重要提醒**：本文档基于 2024年12月24日的项目真实状态编写。项目目前**前后端未完全集成**，前端仍在使用模拟数据。请按照上述步骤完成集成工作。 