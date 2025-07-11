"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MailboxManager } from "@/components/enhanced-mailbox-manager"
import { 
  Mail, 
  Inbox, 
  Send, 
  Plus, 
  Settings,
  User,
  Clock,
  Archive,
  Trash2,
  Star,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  label?: string
}

interface EmailSidebarProps {
  currentEmail?: string
  currentEmailAddress?: EmailAddress | null
  onGenerateEmail?: () => void
  onSendTestEmail?: () => void
  onNavigationClick?: (filter: 'inbox' | 'starred' | 'archived' | 'trash') => void
  onAddressSelect?: (address: EmailAddress) => void
  onAddressUpdate?: (address: EmailAddress) => void
  currentFilter?: 'inbox' | 'starred' | 'archived' | 'trash'
  starredCount?: number
  archivedCount?: number
  trashCount?: number
  unreadCount?: number
  totalCount?: number
  isLoading?: boolean
}

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count?: number
  active?: boolean
  filter: 'inbox' | 'starred' | 'archived' | 'trash'
  onClick?: () => void
}

export function EmailSidebar({ 
  currentEmail, 
  currentEmailAddress,
  onGenerateEmail,
  onSendTestEmail,
  onNavigationClick,
  onAddressSelect,
  onAddressUpdate,
  currentFilter = 'inbox',
  starredCount = 0,
  archivedCount = 0,
  trashCount = 0,
  unreadCount = 0,
  totalCount = 0,
  isLoading 
}: EmailSidebarProps) {
  const [showMailboxManager, setShowMailboxManager] = useState(false)
  
  const navigationItems: NavigationItem[] = [
    {
      icon: Inbox,
      label: "收件箱",
      count: unreadCount,
      active: currentFilter === 'inbox',
      filter: 'inbox',
      onClick: () => onNavigationClick?.('inbox'),
    },
    {
      icon: Star,
      label: "已加星标",
      count: starredCount,
      active: currentFilter === 'starred',
      filter: 'starred',
      onClick: () => onNavigationClick?.('starred'),
    },
    {
      icon: Archive,
      label: "已归档",
      count: archivedCount,
      active: currentFilter === 'archived',
      filter: 'archived',
      onClick: () => onNavigationClick?.('archived'),
    },
    {
      icon: Trash2,
      label: "垃圾箱",
      count: trashCount,
      active: currentFilter === 'trash',
      filter: 'trash',
      onClick: () => onNavigationClick?.('trash'),
    },
  ]

  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* 头部 - 用户信息 */}
      <div className="flex h-14 items-center px-4 lg:h-16 lg:px-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">临时邮箱</span>
            <span className="text-xs text-muted-foreground">匿名用户</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* 快速操作区域 */}
      <div className="p-4 space-y-2">
        <Button 
          onClick={onGenerateEmail}
          disabled={isLoading}
          className="w-full justify-start bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          生成新邮箱
        </Button>
        
        {/* 邮箱管理器按钮 */}
        <Dialog open={showMailboxManager} onOpenChange={setShowMailboxManager}>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Layers className="mr-2 h-4 w-4" />
              邮箱管理器
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>邮箱管理器</DialogTitle>
              <DialogDescription>
                管理您的临时邮箱地址
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <MailboxManager 
                currentAddressId={currentEmailAddress?.id || ''}
                onAddressSelect={(address) => {
                  onAddressSelect?.(address)
                  setShowMailboxManager(false)
                }}
                onAddressUpdate={onAddressUpdate || (() => {})}
              />
            </div>
          </DialogContent>
        </Dialog>
        
        {currentEmail && (
          <Button 
            onClick={onSendTestEmail}
            disabled={isLoading}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" />
            测试邮件
          </Button>
        )}
      </div>

      <Separator />

      {/* 当前邮箱信息 */}
      {currentEmail && currentEmailAddress && (
        <div className="p-4">
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">当前邮箱</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono break-all text-muted-foreground">
                {currentEmail}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{Math.floor((new Date(currentEmailAddress.expiresAt).getTime() - new Date().getTime()) / (1000 * 60))}分钟</span>
                </div>
                <div className="flex items-center gap-1">
                  <Inbox className="h-3 w-3" />
                  <span>{totalCount} 封邮件</span>
                </div>
              </div>
              {currentEmailAddress.label && (
                <Badge variant="outline" className="text-xs">
                  {currentEmailAddress.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 导航菜单 */}
      <nav className="flex-1 px-2 py-2">
        <div className="space-y-1">
          {navigationItems.map((item, index) => (
            <Button
              key={index}
              variant={item.active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                item.active && "bg-secondary"
              )}
              onClick={item.onClick}
            >
              <item.icon className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <Badge variant={item.active ? "default" : "secondary"} className="ml-auto h-5">
                  {item.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </nav>

      {/* 底部设置 */}
      <div className="p-4">
        <Separator className="mb-4" />
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          设置
        </Button>
      </div>
    </div>
  )
} 