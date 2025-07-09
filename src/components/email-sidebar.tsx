"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  RefreshCw,
  Copy
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailSidebarProps {
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

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count?: number
  active?: boolean
  onClick?: () => void
}

export function EmailSidebar({ 
  currentEmail, 
  onGenerateEmail,
  onCopyEmail,
  onSendTestEmail,
  onRefreshEmails,
  onToggleAutoRefresh,
  autoRefresh,
  lastRefresh,
  unreadCount = 0,
  totalCount = 0,
  isLoading 
}: EmailSidebarProps) {
  const navigationItems: NavigationItem[] = [
    {
      icon: Inbox,
      label: "收件箱",
      count: unreadCount,
      active: true,
    },
    {
      icon: Send,
      label: "已发送",
      count: 0,
    },
    {
      icon: Star,
      label: "已加星标",
      count: 0,
    },
    {
      icon: Archive,
      label: "已归档",
      count: 0,
    },
    {
      icon: Trash2,
      label: "垃圾箱",
      count: 0,
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
          className="w-full justify-start"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          生成新邮箱
        </Button>
        
        {currentEmail && (
          <>
            <div className="flex gap-2">
              <Button 
                onClick={onCopyEmail}
                disabled={isLoading}
                variant="outline"
                className="flex-1 justify-start"
                size="sm"
              >
                <Copy className="mr-2 h-4 w-4" />
                复制地址
              </Button>
              <Button 
                onClick={onSendTestEmail}
                disabled={isLoading}
                variant="outline"
                className="flex-1 justify-start"
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                测试邮件
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={onRefreshEmails}
                disabled={isLoading}
                variant="outline"
                className="flex-1 justify-start"
                size="sm"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                刷新
              </Button>
              <Button 
                onClick={onToggleAutoRefresh}
                variant={autoRefresh ? "default" : "outline"}
                className="flex-1 justify-start"
                size="sm"
              >
                <Clock className="mr-2 h-4 w-4" />
                {autoRefresh ? "自动" : "手动"}
              </Button>
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* 当前邮箱信息 */}
      {currentEmail && (
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
                  <span>60分钟</span>
                </div>
                <div className="flex items-center gap-1">
                  <Inbox className="h-3 w-3" />
                  <span>{totalCount} 封邮件</span>
                </div>
              </div>
              {lastRefresh && (
                <p className="text-xs text-muted-foreground">
                  最后更新: {lastRefresh.toLocaleTimeString()}
                </p>
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