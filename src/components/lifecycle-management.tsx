"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  Settings,
  Plus,
  Timer
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

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

interface LifecycleManagementProps {
  emailAddress: EmailAddress | null | undefined
  onAddressUpdate?: (address: EmailAddress) => void
}

export function LifecycleManagement({ 
  emailAddress, 
  onAddressUpdate 
}: LifecycleManagementProps) {
  const [isRenewing, setIsRenewing] = useState(false)
  const [additionalMinutes, setAdditionalMinutes] = useState(60)
  const [autoRenewalEnabled, setAutoRenewalEnabled] = useState(false)
  const [customExpirationMinutes, setCustomExpirationMinutes] = useState(60)
  const [maxRenewals, setMaxRenewals] = useState(3)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [warningLevel, setWarningLevel] = useState<'none' | 'warning' | 'urgent' | 'expired'>('none')

  // 更新本地状态
  useEffect(() => {
    if (emailAddress) {
      setAutoRenewalEnabled(emailAddress.autoRenewalEnabled)
      setCustomExpirationMinutes(emailAddress.customExpirationMinutes)
      setMaxRenewals(emailAddress.maxRenewals)
    }
  }, [emailAddress])

  // 计算剩余时间和警告级别
  useEffect(() => {
    if (!emailAddress) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const expiresAt = new Date(emailAddress.expiresAt)
      const timeDiff = expiresAt.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setTimeRemaining("已过期")
        setWarningLevel('expired')
        return
      }

      const minutes = Math.floor(timeDiff / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) {
        setTimeRemaining(`${days}天 ${hours % 24}小时`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}小时 ${minutes % 60}分钟`)
      } else {
        setTimeRemaining(`${minutes}分钟`)
      }

      // 设置警告级别
      if (minutes <= 5) {
        setWarningLevel('urgent')
      } else if (minutes <= 30) {
        setWarningLevel('warning')
      } else {
        setWarningLevel('none')
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // 每分钟更新

    return () => clearInterval(interval)
  }, [emailAddress])

  // 续期邮箱
  const handleRenewAddress = async () => {
    if (!emailAddress) return

    setIsRenewing(true)
    try {
      const response = await fetch(`/api/addresses/${emailAddress.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalMinutes }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to renew address')
      }

      const data = await response.json()
      if (onAddressUpdate) {
        onAddressUpdate(data.emailAddress)
      }
      
      toast.success(`邮箱已续期${additionalMinutes}分钟`)
    } catch (error) {
      console.error('Error renewing address:', error)
      toast.error(error instanceof Error ? error.message : '续期失败')
    } finally {
      setIsRenewing(false)
    }
  }

  // 更新生命周期设置
  const handleUpdateLifecycleSettings = async () => {
    if (!emailAddress) return

    try {
      const response = await fetch(`/api/addresses/${emailAddress.id}/lifecycle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoRenewalEnabled,
          customExpirationMinutes,
          maxRenewals,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }

      const data = await response.json()
      if (onAddressUpdate) {
        onAddressUpdate(data.emailAddress)
      }
      
      toast.success('生命周期设置已更新')
    } catch (error) {
      console.error('Error updating lifecycle settings:', error)
      toast.error(error instanceof Error ? error.message : '更新失败')
    }
  }

  // 获取警告级别颜色
  const getWarningColor = () => {
    switch (warningLevel) {
      case 'urgent':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'expired':
        return 'bg-gray-500'
      default:
        return 'bg-green-500'
    }
  }

  if (!emailAddress) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Clock className="h-4 w-4" />
      </Button>
    )
  }

  const canRenew = emailAddress.renewalCount < emailAddress.maxRenewals
  const isExpired = new Date(emailAddress.expiresAt) <= new Date()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Clock className="h-4 w-4" />
          {warningLevel !== 'none' && (
            <Badge 
              variant="default" 
              className={`absolute -top-1 -right-1 h-3 w-3 p-0 ${getWarningColor()}`}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <h4 className="font-medium">邮箱生命周期管理</h4>
          </div>

          {/* 过期状态 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">剩余时间</span>
              <Badge 
                variant={isExpired ? "destructive" : warningLevel === 'urgent' ? "destructive" : warningLevel === 'warning' ? "secondary" : "default"}
                className="text-xs"
              >
                {timeRemaining}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>已续期次数</span>
              <span>{emailAddress.renewalCount}/{emailAddress.maxRenewals}</span>
            </div>
          </div>

          {/* 续期操作 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">续期操作</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={additionalMinutes.toString()} onValueChange={(value) => setAdditionalMinutes(parseInt(value))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30分钟</SelectItem>
                  <SelectItem value="60">1小时</SelectItem>
                  <SelectItem value="120">2小时</SelectItem>
                  <SelectItem value="360">6小时</SelectItem>
                  <SelectItem value="720">12小时</SelectItem>
                  <SelectItem value="1440">24小时</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleRenewAddress}
                disabled={!canRenew || isRenewing}
                size="sm"
              >
                {isRenewing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {!canRenew && (
              <p className="text-xs text-muted-foreground">
                已达到最大续期次数限制
              </p>
            )}
          </div>

          {/* 自动续期设置 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">自动续期设置</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">启用自动续期</span>
              <Switch
                checked={autoRenewalEnabled}
                onCheckedChange={setAutoRenewalEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">默认续期时长</span>
              <Select 
                value={customExpirationMinutes.toString()} 
                onValueChange={(value) => setCustomExpirationMinutes(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30分钟</SelectItem>
                  <SelectItem value="60">1小时</SelectItem>
                  <SelectItem value="120">2小时</SelectItem>
                  <SelectItem value="360">6小时</SelectItem>
                  <SelectItem value="720">12小时</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">最大续期次数</span>
              <Select 
                value={maxRenewals.toString()} 
                onValueChange={(value) => setMaxRenewals(parseInt(value))}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 保存设置 */}
          <Button 
            onClick={handleUpdateLifecycleSettings}
            className="w-full"
            size="sm"
          >
            保存设置
          </Button>

          {/* 警告信息 */}
          {warningLevel === 'urgent' && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-700">
                邮箱即将过期，请及时续期以免丢失邮件
              </p>
            </div>
          )}
          
          {warningLevel === 'expired' && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-gray-600" />
              <p className="text-xs text-gray-700">
                邮箱已过期，无法接收新邮件
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}