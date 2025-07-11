"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  ImageIcon,
  FileText,
  Database
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  detectSensitiveInfo, 
  maskSensitiveInfo, 
  getSensitiveInfoStats 
} from "@/lib/security"
import { toast } from "sonner"

interface SecuritySettingsProps {
  onSettingsChange?: (settings: SecuritySettings) => void
}

export interface SecuritySettings {
  enableEncryption: boolean
  enableImageProxy: boolean
  enableSensitiveDetection: boolean
  autoMaskSensitive: boolean
  enableSecureStorage: boolean
}

export function SecuritySettings({ onSettingsChange }: SecuritySettingsProps) {
  const [settings, setSettings] = useState<SecuritySettings>({
    enableEncryption: true,
    enableImageProxy: true,
    enableSensitiveDetection: true,
    autoMaskSensitive: false,
    enableSecureStorage: true,
  })
  
  const [testContent, setTestContent] = useState("")
  const [sensitiveStats, setSensitiveStats] = useState<{
    totalMatches: number;
    types: Record<string, number>;
    hasSensitive: boolean;
  } | null>(null)
  const [showMasked, setShowMasked] = useState(false)

  // 从localStorage加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('security-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (error) {
        console.error('Error loading security settings:', error)
      }
    }
  }, [])

  // 保存设置到localStorage
  const saveSettings = (newSettings: SecuritySettings) => {
    localStorage.setItem('security-settings', JSON.stringify(newSettings))
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }

  // 更新设置
  const updateSetting = (key: keyof SecuritySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    saveSettings(newSettings)
    
    const settingNames: Record<string, string> = {
      enableEncryption: '内容加密',
      enableImageProxy: '图片代理',
      enableSensitiveDetection: '敏感信息检测',
      autoMaskSensitive: '自动遮蔽敏感信息',
      enableSecureStorage: '安全存储',
    }
    
    toast.success(`${settingNames[key]}已${value ? '开启' : '关闭'}`)
  }

  // 测试敏感信息检测
  const testSensitiveDetection = () => {
    if (!testContent.trim()) {
      toast.error('请输入测试内容')
      return
    }
    
    const stats = getSensitiveInfoStats(testContent)
    setSensitiveStats(stats)
    
    if (stats.hasSensitive) {
      toast.warning(`检测到${stats.totalMatches}个敏感信息`)
    } else {
      toast.success('未检测到敏感信息')
    }
  }

  // 获取遮蔽后的内容
  const getMaskedContent = () => {
    if (!testContent.trim()) return ''
    
    const matches = detectSensitiveInfo(testContent)
    return maskSensitiveInfo(testContent, matches)
  }

  // 获取安全等级
  const getSecurityLevel = () => {
    const enabledCount = Object.values(settings).filter(Boolean).length
    const totalCount = Object.keys(settings).length
    const percentage = (enabledCount / totalCount) * 100
    
    if (percentage >= 80) return { level: 'high', color: 'bg-green-500', text: '高' }
    if (percentage >= 60) return { level: 'medium', color: 'bg-yellow-500', text: '中' }
    return { level: 'low', color: 'bg-red-500', text: '低' }
  }

  const securityLevel = getSecurityLevel()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Shield className="h-4 w-4" />
          <Badge 
            variant="default" 
            className={`absolute -top-1 -right-1 h-3 w-3 p-0 ${securityLevel.color}`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <h4 className="font-medium">安全与隐私设置</h4>
            <Badge variant="outline" className="text-xs">
              安全等级: {securityLevel.text}
            </Badge>
          </div>

          {/* 安全设置开关 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm">内容加密存储</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>邮件内容将使用加密算法存储</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={settings.enableEncryption}
                onCheckedChange={(checked) => updateSetting('enableEncryption', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">图片安全代理</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>通过代理服务器加载图片，防止隐私泄露</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={settings.enableImageProxy}
                onCheckedChange={(checked) => updateSetting('enableImageProxy', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm">敏感信息检测</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>自动检测信用卡号、身份证等敏感信息</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={settings.enableSensitiveDetection}
                onCheckedChange={(checked) => updateSetting('enableSensitiveDetection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                <span className="text-sm">自动遮蔽敏感信息</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>自动用*号遮蔽检测到的敏感信息</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={settings.autoMaskSensitive}
                onCheckedChange={(checked) => updateSetting('autoMaskSensitive', checked)}
                disabled={!settings.enableSensitiveDetection}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="text-sm">安全存储模式</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>增强的数据库安全存储机制</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={settings.enableSecureStorage}
                onCheckedChange={(checked) => updateSetting('enableSecureStorage', checked)}
              />
            </div>
          </div>

          {/* 敏感信息检测测试 */}
          {settings.enableSensitiveDetection && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">敏感信息检测测试</span>
              </div>
              
              <textarea
                className="w-full h-20 p-2 text-xs border rounded resize-none"
                placeholder="输入测试内容（例如：我的手机号是13800138000，信用卡号是6212 3456 7890 1234）"
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
              />
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSensitiveDetection}
                  className="text-xs"
                >
                  检测
                </Button>
                
                {testContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMasked(!showMasked)}
                    className="text-xs"
                  >
                    {showMasked ? '显示原文' : '显示遮蔽'}
                  </Button>
                )}
              </div>
              
              {testContent && showMasked && (
                <div className="p-2 bg-muted rounded text-xs">
                  <div className="text-muted-foreground mb-1">遮蔽后内容：</div>
                  <div className="font-mono">{getMaskedContent()}</div>
                </div>
              )}
              
              {sensitiveStats && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {sensitiveStats.hasSensitive ? (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                    <span className="text-xs">
                      {sensitiveStats.hasSensitive 
                        ? `检测到${sensitiveStats.totalMatches}个敏感信息` 
                        : '未检测到敏感信息'
                      }
                    </span>
                  </div>
                  
                  {sensitiveStats.hasSensitive && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(sensitiveStats.types).map(([type, count]) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 安全状态总结 */}
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• 所有设置会自动保存到本地</div>
              <div>• 加密功能保护邮件内容安全</div>
              <div>• 图片代理防止IP地址泄露</div>
              <div>• 敏感信息检测保护隐私</div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}