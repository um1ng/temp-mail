"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX,
  Settings
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNotifications, useNotificationSound } from "@/hooks/use-notifications"
import { toast } from "sonner"

interface Email {
  id: string
  from: string
  to: string
  subject?: string
  content: string
  timestamp: Date
}

interface NotificationSettingsProps {
  onNewEmailNotification?: (notifyFn: (email: Email) => void) => void
}

export function NotificationSettings({ onNewEmailNotification }: NotificationSettingsProps) {
  const { permission, requestPermission, showNotification, isSupported } = useNotifications()
  const { playNotificationSound, isEnabled: soundEnabled, toggleSound } = useNotificationSound()
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  // 从localStorage加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('notification-settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setNotificationsEnabled(settings.enabled && permission === 'granted')
    }
  }, [permission])

  // 保存设置到localStorage
  const saveSettings = (enabled: boolean, sound: boolean) => {
    localStorage.setItem('notification-settings', JSON.stringify({
      enabled,
      sound,
    }))
  }

  // 切换通知开关
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled && permission !== 'granted') {
      const granted = await requestPermission()
      if (granted) {
        setNotificationsEnabled(true)
        saveSettings(true, soundEnabled)
        toast.success("通知已开启")
      }
    } else {
      const newState = !notificationsEnabled
      setNotificationsEnabled(newState)
      saveSettings(newState, soundEnabled)
      toast.success(newState ? "通知已开启" : "通知已关闭")
    }
  }

  // 切换音效开关
  const handleToggleSound = () => {
    toggleSound()
    saveSettings(notificationsEnabled, !soundEnabled)
    toast.success(soundEnabled ? "通知音效已关闭" : "通知音效已开启")
  }

  // 显示测试通知
  const showTestNotification = () => {
    if (notificationsEnabled) {
      showNotification("测试通知", {
        body: "这是一个测试通知，用于验证通知功能是否正常工作。",
        icon: "/favicon.ico"
      })
      
      if (soundEnabled) {
        playNotificationSound()
      }
      
      toast.success("测试通知已发送")
    } else {
      toast.error("请先开启通知权限")
    }
  }

  // 显示新邮件通知
  const showNewEmailNotification = React.useCallback((email: Email) => {
    if (!notificationsEnabled) return

    showNotification("新邮件到达", {
      body: `来自: ${email.from}\n主题: ${email.subject || "(无主题)"}`,
      icon: "/favicon.ico",
      tag: `email-${email.id}`,
    })

    if (soundEnabled) {
      playNotificationSound()
    }
  }, [notificationsEnabled, soundEnabled, showNotification, playNotificationSound])

  // 暴露通知函数给父组件
  React.useEffect(() => {
    if (onNewEmailNotification) {
      onNewEmailNotification(showNewEmailNotification)
    }
  }, [onNewEmailNotification, showNewEmailNotification])

  if (!isSupported) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <BellOff className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {notificationsEnabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          {notificationsEnabled && (
            <Badge 
              variant="default" 
              className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-green-500"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h4 className="font-medium">通知设置</h4>
          </div>

          {/* 通知权限状态 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">浏览器通知</span>
              <div className="flex items-center gap-2">
                {permission === 'granted' && (
                  <Badge variant="secondary" className="text-xs">
                    已授权
                  </Badge>
                )}
                {permission === 'denied' && (
                  <Badge variant="destructive" className="text-xs">
                    已拒绝
                  </Badge>
                )}
                {permission === 'default' && (
                  <Badge variant="outline" className="text-xs">
                    未设置
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">启用新邮件通知</span>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleToggleNotifications}
                disabled={permission === 'denied'}
              />
            </div>
          </div>

          {/* 音效设置 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="text-sm">通知音效</span>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleToggleSound}
            />
          </div>

          {/* 测试按钮 */}
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={showTestNotification}
              className="w-full"
              disabled={!notificationsEnabled}
            >
              发送测试通知
            </Button>
            
            {permission === 'denied' && (
              <p className="text-xs text-muted-foreground">
                通知权限被拒绝，请在浏览器设置中手动开启通知权限。
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}