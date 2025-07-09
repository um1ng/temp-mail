"use client"

import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { EmailSidebar } from "@/components/email-sidebar"
import { 
  Mail, 
  RefreshCw, 
  Copy,
  Menu,
  Search
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

interface EmailLayoutProps {
  children: React.ReactNode
  currentEmail?: string
  onGenerateEmail?: () => void
  onCopyEmail?: () => void
  onSendTestEmail?: () => void
  onRefreshEmails?: () => void
  onToggleAutoRefresh?: () => void
  autoRefresh?: boolean
  lastRefresh?: Date | null
  unreadCount?: number
  totalCount?: number
  isLoading?: boolean
}

export function EmailLayout({ 
  children, 
  currentEmail,
  onGenerateEmail,
  onCopyEmail,
  onSendTestEmail,
  onRefreshEmails,
  onToggleAutoRefresh,
  autoRefresh,
  lastRefresh,
  unreadCount,
  totalCount,
  isLoading 
}: EmailLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* 移动端侧边栏 */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full flex-col">
            <EmailSidebar 
              currentEmail={currentEmail}
              onGenerateEmail={onGenerateEmail}
              onCopyEmail={onCopyEmail}
              onSendTestEmail={onSendTestEmail}
              onRefreshEmails={onRefreshEmails}
              onToggleAutoRefresh={onToggleAutoRefresh}
              autoRefresh={autoRefresh}
              lastRefresh={lastRefresh}
              unreadCount={unreadCount}
              totalCount={totalCount}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex md:w-80 md:flex-col">
        <EmailSidebar 
          currentEmail={currentEmail}
          onGenerateEmail={onGenerateEmail}
          onCopyEmail={onCopyEmail}
          onSendTestEmail={onSendTestEmail}
          onRefreshEmails={onRefreshEmails}
          onToggleAutoRefresh={onToggleAutoRefresh}
          autoRefresh={autoRefresh}
          lastRefresh={lastRefresh}
          unreadCount={unreadCount}
          totalCount={totalCount}
          isLoading={isLoading}
        />
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-16 lg:px-6">
          {/* 移动端菜单按钮 */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">切换导航菜单</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* 搜索框 */}
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索邮件..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>

          {/* 当前邮箱地址 */}
          {currentEmail && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="font-mono">{currentEmail}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyEmail}
                className="h-8"
              >
                <Copy className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">复制</span>
              </Button>
            </div>
          )}

          {/* 工具按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshEmails}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              <span className="ml-2 hidden sm:inline">刷新</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 