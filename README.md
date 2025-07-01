# 📧 Temporary Email Service

> **A modern, privacy-focused temporary email service built with cutting-edge web technologies**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🎯 What is This?

Imagine needing an email address for a one-time signup, testing a service, or protecting your privacy online. This temporary email service provides **instant, disposable email addresses** that automatically expire after a set time, keeping your real inbox clean and your privacy intact.

Perfect for:
- 🛡️ **Privacy Protection** - Shield your real email from spam and tracking
- 🧪 **Development & Testing** - Test email workflows without cluttering real inboxes
- 📝 **Quick Signups** - Register for services without long-term commitment
- 🔒 **Anonymous Communication** - Maintain anonymity in digital interactions

## ✨ Key Features

### 🚀 **Instant Email Generation**
Generate unique, working email addresses in milliseconds with customizable domains and expiration times.

### 📱 **Modern Responsive Interface**
Beautiful, intuitive UI that works flawlessly across all devices - from desktop to mobile.

### ⚡ **Real-time Email Management**
- **Live Email Reception** - Emails appear instantly in your temporary inbox
- **Rich Content Support** - View both HTML and plain text emails
- **Attachment Handling** - Download and manage email attachments
- **Read/Unread Tracking** - Smart email status management

### 🎨 **Elegant User Experience**
- **Tabbed Interface** - Switch between list and detailed email views
- **One-Click Actions** - Copy addresses, delete emails, mark as read
- **Dark/Light Theme** - Adaptive design that respects user preferences
- **Smooth Animations** - Polished interactions and state transitions

### 🔧 **Developer-Friendly**
- **RESTful API** - Complete programmatic access to all features
- **TypeScript Throughout** - Full type safety and excellent DX
- **Comprehensive Documentation** - Clear API docs and implementation guides

## 🏗️ Architecture & Tech Stack

### **Frontend Excellence**
- **[Next.js 15](https://nextjs.org/)** - Latest React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible components
- **[Lucide Icons](https://lucide.dev/)** - Consistent, modern iconography

### **Backend Powerhouse**
- **[Prisma ORM](https://www.prisma.io/)** - Type-safe database operations
- **[PostgreSQL](https://postgresql.org/)** - Robust, scalable data storage
- **[Zod](https://zod.dev/)** - Runtime type validation
- **[Nodemailer](https://nodemailer.com/)** - Email processing engine

### **Development & Deployment**
- **[Docker](https://docker.com/)** - Containerized development environment
- **[MailHog](https://github.com/mailhog/MailHog)** - Local email testing
- **[Redis](https://redis.io/)** - Caching and session management
- **[Adminer](https://www.adminer.org/)** - Database administration

## 🚀 Quick Start

### Prerequisites

Make sure you have these tools installed:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **Docker Desktop** - [Get it here](https://docker.com/products/docker-desktop/)

### 🛠️ Installation

1. **Clone and Navigate**
   ```bash
   git clone https://github.com/your-username/temp-mail.git
   cd temp-mail
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development Environment**
   ```bash
   # Start Docker services (PostgreSQL, Redis, MailHog)
   docker-compose up -d
   
   # Verify services are running
   docker-compose ps
   ```

4. **Configure Environment**
   ```bash
   # Copy and edit environment variables
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

5. **Initialize Database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # (Optional) Open database browser
   npx prisma studio
   ```

6. **Launch Application**
   ```bash
   pnpm dev
   ```

🎉 **You're ready!** Open [http://localhost:3000](http://localhost:3000) and start creating temporary emails!

### 🐳 Docker Development

For a completely isolated development environment:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**Available Services:**
- **Application**: http://localhost:3000
- **MailHog UI**: http://localhost:8025 (Email testing interface)
- **Adminer**: http://localhost:8080 (Database management)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📋 Available Commands

```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint checks

# Database Operations
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:reset         # Reset database to clean state
pnpm db:seed          # Populate with sample data

# Docker Operations
pnpm docker:up        # Start all Docker services
pnpm docker:down      # Stop all Docker services
pnpm docker:logs      # View container logs
pnpm docker:clean     # Remove all containers and volumes
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with these settings:

```env
# Database Configuration
DATABASE_URL="postgresql://tempmail_user:tempmail_pass@localhost:5432/tempmail_db"

# Email Domains (customize your available domains)
ALLOWED_DOMAINS="tempmail.local,10minutemail.local,guerrillamail.local"

# Email Settings
EMAIL_EXPIRATION_MINUTES=60
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Real SMTP for production
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

### Customizing Domains

Add your own domains to the `ALLOWED_DOMAINS` environment variable:

```env
ALLOWED_DOMAINS="mytemp.email,quickmail.dev,testinbox.com"
```

## 📚 API Reference

### 📬 Email Addresses

**Create New Address**
```http
POST /api/addresses
Content-Type: application/json

{
  "expirationMinutes": 60,
  "domain": "tempmail.local"
}
```

**Get Address Details**
```http
GET /api/addresses?address=example@tempmail.local
```

**Response:**
```json
{
  "emailAddress": {
    "id": "cuid123",
    "address": "abc123@tempmail.local",
    "createdAt": "2024-12-24T10:00:00Z",
    "expiresAt": "2024-12-24T11:00:00Z",
    "isActive": true
  }
}
```

### 📧 Email Management

**Get Emails for Address**
```http
GET /api/emails?emailAddressId=cuid123&page=1&limit=20
```

**Get Specific Email**
```http
GET /api/emails/email_id_123
```

**Mark as Read/Unread**
```http
PATCH /api/emails/email_id_123
Content-Type: application/json

{
  "isRead": true
}
```

**Delete Email**
```http
DELETE /api/emails/email_id_123
```

## 🧪 Testing

### Email Testing with MailHog

1. **Access MailHog Interface**: http://localhost:8025
2. **Send Test Email**: Use the web interface or SMTP
3. **View in Application**: Refresh your temporary inbox

### API Testing

```bash
# Test email address creation
curl -X POST http://localhost:3000/api/addresses \
  -H "Content-Type: application/json" \
  -d '{"expirationMinutes": 30}'

# Test email retrieval
curl "http://localhost:3000/api/emails?emailAddressId=YOUR_ADDRESS_ID"
```

## 🎨 User Interface

### Main Features

- **🎯 Instant Generation**: Click to generate a new temporary email address
- **📋 One-Click Copy**: Copy addresses to clipboard with a single click
- **🔄 Smart Refresh**: Auto-refresh emails or manually trigger updates
- **📱 Mobile Optimized**: Fully responsive design for all screen sizes
- **🎭 Dual Views**: Toggle between compact list and detailed email views
- **🗑️ Quick Actions**: Delete, mark as read, or manage emails efficiently

### Design Philosophy

Our interface follows modern UX principles:
- **Minimalist Design**: Clean, distraction-free interface
- **Intuitive Navigation**: Logical flow and clear action buttons
- **Accessible**: WCAG compliant with keyboard navigation support
- **Fast Loading**: Optimized for quick interactions and responsiveness

## 🔒 Privacy & Security

- **No Personal Data**: We don't store any personal information
- **Automatic Cleanup**: Emails and addresses are automatically purged
- **Local Processing**: All email processing happens on your infrastructure
- **Open Source**: Full transparency with open source code

## 🛠️ Development Status

### ✅ Completed Features
- Complete database schema and migrations
- Full backend API implementation (CRUD operations)
- Modern, responsive frontend interface
- Docker development environment
- TypeScript type definitions
- Component library integration

### 🚧 In Progress
- Email service layer implementation
- Frontend-backend integration
- Real-time email notifications
- SMTP server integration

### 📋 Roadmap
- [ ] WebSocket real-time updates
- [ ] Email forwarding capabilities
- [ ] Advanced search and filtering
- [ ] Custom domain support
- [ ] API rate limiting
- [ ] Performance monitoring
- [ ] Mobile application

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/temp-mail.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Commit and Push**
   ```bash
   git commit -m "✨ Add amazing new feature"
   git push origin feature/amazing-new-feature
   ```

5. **Open Pull Request**
   Describe your changes and link any relevant issues

### Development Guidelines

- **Code Quality**: Use TypeScript, ESLint, and Prettier
- **Testing**: Write tests for new features
- **Documentation**: Update docs for any API changes
- **Performance**: Consider performance implications
- **Security**: Follow security best practices

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using modern web technologies**

[Report Bug](https://github.com/your-username/temp-mail/issues) • [Request Feature](https://github.com/your-username/temp-mail/issues) • [Documentation](https://github.com/your-username/temp-mail/wiki)

</div>

