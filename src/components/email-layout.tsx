"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EmailSidebar } from "@/components/email-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { EmailSearch } from "@/components/email-search"
import { NotificationSettings } from "@/components/notification-settings"
import { LifecycleManagement } from "@/components/lifecycle-management"
import { SecuritySettings } from "@/components/security-settings"
import { PWAInstall } from "@/components/pwa-install"
import type { SearchFilters } from "@/components/email-search"
import type { SecuritySettings as SecuritySettingsType } from "@/components/security-settings"
import { 
  Mail, 
  Menu
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface EmailAddress {
  id: string
  address: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  renewalCount: number
  maxRenewals: number
  lastRenewalAt?: Date
  warningsSent: number
  autoRenewalEnabled: boolean
  customExpirationMinutes: number
}

interface Email {
  id: string
  from: string
  to: string
  subject?: string
  content: string
  timestamp: Date
}

interface EmailLayoutProps {
  children: React.ReactNode
  currentEmail?: string
  currentEmailAddress?: EmailAddress | null
  onGenerateEmail?: () => void
  onSendTestEmail?: () => void
  onNavigationClick?: (filter: 'inbox' | 'starred' | 'archived' | 'trash') => void
  onSearch?: (query: string, filters: SearchFilters) => void
  onClearSearch?: () => void
  onNewEmailNotification?: (notifyFn: (email: Email) => void) => void
  onAddressSelect?: (address: EmailAddress) => void
  onAddressUpdate?: (address: EmailAddress) => void
  onSecuritySettingsChange?: (settings: SecuritySettingsType) => void
  currentFilter?: 'inbox' | 'starred' | 'archived' | 'trash'
  starredCount?: number
  archivedCount?: number
  trashCount?: number
  unreadCount?: number
  totalCount?: number
  isLoading?: boolean
}

export function EmailLayout({ 
  children, 
  currentEmail,
  currentEmailAddress,
  onGenerateEmail,
  onSendTestEmail,
  onNavigationClick,
  onSearch,
  onClearSearch,
  onNewEmailNotification,
  onAddressSelect,
  onAddressUpdate,
  onSecuritySettingsChange,
  currentFilter,
  starredCount,
  archivedCount,
  trashCount,
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
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle>导航菜单</SheetTitle>
              <SheetDescription>
                邮箱管理和导航菜单
              </SheetDescription>
            </SheetHeader>
          </VisuallyHidden>
          <div className="flex h-full flex-col">
            <EmailSidebar 
              currentEmail={currentEmail}
              currentEmailAddress={currentEmailAddress}
              onGenerateEmail={onGenerateEmail}
              onSendTestEmail={onSendTestEmail}
              onNavigationClick={onNavigationClick}
              onAddressSelect={onAddressSelect}
              onAddressUpdate={onAddressUpdate}
              currentFilter={currentFilter}
              starredCount={starredCount}
              archivedCount={archivedCount}
              trashCount={trashCount}
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
          currentEmailAddress={currentEmailAddress}
          onGenerateEmail={onGenerateEmail}
          onSendTestEmail={onSendTestEmail}
          onNavigationClick={onNavigationClick}
          onAddressSelect={onAddressSelect}
          onAddressUpdate={onAddressUpdate}
          currentFilter={currentFilter}
          starredCount={starredCount}
          archivedCount={archivedCount}
          trashCount={trashCount}
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
            <EmailSearch
              onSearch={onSearch || (() => {})}
              onClear={onClearSearch || (() => {})}
              isSearching={isLoading}
            />
          </div>

          {/* 当前邮箱地址 */}
          {currentEmail && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="font-mono">{currentEmail}</span>
              </div>
            </div>
          )}

          {/* 工具按钮 */}
          <div className="flex items-center gap-2">
            <PWAInstall />
            <SecuritySettings onSettingsChange={onSecuritySettingsChange} />
            <LifecycleManagement 
              emailAddress={currentEmailAddress}
              onAddressUpdate={onAddressUpdate}
            />
            <NotificationSettings onNewEmailNotification={onNewEmailNotification} />
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