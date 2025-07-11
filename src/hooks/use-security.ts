"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  sanitizeHtmlContent,
  detectSensitiveInfo,
  maskSensitiveInfo,
  generateProxyImageUrl
} from "@/lib/security"
import type { SecuritySettings } from "@/components/security-settings"

interface UseSecurityReturn {
  settings: SecuritySettings
  updateSettings: (settings: SecuritySettings) => void
  processEmailContent: (content: string, isHtml?: boolean) => string
  processEmailText: (text: string) => string
  processImageUrl: (url: string) => string
  checkSensitiveInfo: (content: string) => { hasSensitive: boolean; count: number }
}

const DEFAULT_SETTINGS: SecuritySettings = {
  enableEncryption: true,
  enableImageProxy: true,
  enableSensitiveDetection: true,
  autoMaskSensitive: false,
  enableSecureStorage: true,
}

export function useSecurity(): UseSecurityReturn {
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS)

  // 从localStorage加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('security-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (error) {
        console.error('Error loading security settings:', error)
      }
    }
  }, [])

  // 更新设置
  const updateSettings = useCallback((newSettings: SecuritySettings) => {
    setSettings(newSettings)
    localStorage.setItem('security-settings', JSON.stringify(newSettings))
  }, [])

  // 处理邮件HTML内容
  const processEmailContent = useCallback((content: string, isHtml: boolean = false): string => {
    if (!content) return content

    let processedContent = content

    // 如果是HTML内容，先进行HTML安全处理
    if (isHtml) {
      processedContent = sanitizeHtmlContent(processedContent)
    }

    // 敏感信息检测和遮蔽
    if (settings.enableSensitiveDetection && settings.autoMaskSensitive) {
      const sensitiveMatches = detectSensitiveInfo(processedContent)
      if (sensitiveMatches.length > 0) {
        processedContent = maskSensitiveInfo(processedContent, sensitiveMatches)
      }
    }

    return processedContent
  }, [settings])

  // 处理纯文本邮件内容
  const processEmailText = useCallback((text: string): string => {
    if (!text) return text

    let processedText = text

    // 敏感信息检测和遮蔽
    if (settings.enableSensitiveDetection && settings.autoMaskSensitive) {
      const sensitiveMatches = detectSensitiveInfo(processedText)
      if (sensitiveMatches.length > 0) {
        processedText = maskSensitiveInfo(processedText, sensitiveMatches)
      }
    }

    return processedText
  }, [settings])

  // 处理图片URL
  const processImageUrl = useCallback((url: string): string => {
    if (!url || !settings.enableImageProxy) return url

    // 如果已经是代理URL，直接返回
    if (url.includes('/api/proxy/image')) return url

    // 只代理外部图片URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return generateProxyImageUrl(url)
    }

    return url
  }, [settings])

  // 检查敏感信息
  const checkSensitiveInfo = useCallback((content: string) => {
    if (!settings.enableSensitiveDetection) {
      return { hasSensitive: false, count: 0 }
    }

    const matches = detectSensitiveInfo(content)
    return {
      hasSensitive: matches.length > 0,
      count: matches.length,
    }
  }, [settings])

  return {
    settings,
    updateSettings,
    processEmailContent,
    processEmailText,
    processImageUrl,
    checkSensitiveInfo,
  }
}