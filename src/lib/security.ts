// 安全工具库，用于加密、解密和敏感信息检测

/**
 * 简单的Base64编码（用于演示，生产环境应使用更强的加密）
 */
export function encryptContent(content: string): string {
  try {
    return btoa(unescape(encodeURIComponent(content)));
  } catch (error) {
    console.error('Encryption error:', error);
    return content;
  }
}

/**
 * 简单的Base64解码
 */
export function decryptContent(encryptedContent: string): string {
  try {
    return decodeURIComponent(escape(atob(encryptedContent)));
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedContent;
  }
}

/**
 * 敏感信息检测模式
 */
const SENSITIVE_PATTERNS = {
  // 信用卡号 (简化版)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // 社保号/身份证号模式
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  idCard: /\b\d{15}|\d{18}\b/g,
  
  // 手机号
  phone: /\b1[3-9]\d{9}\b/g,
  
  // 邮箱
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // IP地址
  ip: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  
  // 银行账号 (简化)
  bankAccount: /\b\d{16,19}\b/g,
  
  // 密码字段
  password: /(?:password|passwd|pwd|secret|token)[\s:=]+[\w@#$%^&*()]+/gi,
  
  // API密钥
  apiKey: /(?:api[_-]?key|access[_-]?token|secret[_-]?key)[\s:=]+[\w-]+/gi,
  
  // 网址
  url: /https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&%_.])*)?(?:\#(?:[\w.])*)?/g,
}

/**
 * 检测敏感信息
 */
export interface SensitiveMatch {
  type: string;
  value: string;
  start: number;
  end: number;
}

export function detectSensitiveInfo(content: string): SensitiveMatch[] {
  const matches: SensitiveMatch[] = [];
  
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      matches.push({
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  });
  
  return matches.sort((a, b) => a.start - b.start);
}

/**
 * 遮蔽敏感信息
 */
export function maskSensitiveInfo(content: string, matches: SensitiveMatch[]): string {
  if (matches.length === 0) return content;
  
  let maskedContent = content;
  let offset = 0;
  
  matches.forEach((match) => {
    const { type, value, start, end } = match;
    let maskedValue = '';
    
    switch (type) {
      case 'creditCard':
        maskedValue = value.replace(/\d(?=\d{4})/g, '*');
        break;
      case 'phone':
        maskedValue = value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        break;
      case 'email':
        const [name, domain] = value.split('@');
        const maskedName = name.length > 2 ? name[0] + '*'.repeat(name.length - 2) + name[name.length - 1] : name;
        maskedValue = maskedName + '@' + domain;
        break;
      case 'idCard':
        maskedValue = value.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
        break;
      case 'bankAccount':
        maskedValue = value.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
        break;
      case 'password':
      case 'apiKey':
        maskedValue = value.replace(/([:\s=]+)[\w@#$%^&*()-]+/, '$1****');
        break;
      default:
        maskedValue = '*'.repeat(value.length);
    }
    
    const adjustedStart = start + offset;
    const adjustedEnd = end + offset;
    
    maskedContent = maskedContent.slice(0, adjustedStart) + maskedValue + maskedContent.slice(adjustedEnd);
    offset += maskedValue.length - value.length;
  });
  
  return maskedContent;
}

/**
 * 检查内容是否包含敏感信息
 */
export function hasSensitiveInfo(content: string): boolean {
  return detectSensitiveInfo(content).length > 0;
}

/**
 * 获取敏感信息统计
 */
export function getSensitiveInfoStats(content: string) {
  const matches = detectSensitiveInfo(content);
  const stats: Record<string, number> = {};
  
  matches.forEach((match) => {
    stats[match.type] = (stats[match.type] || 0) + 1;
  });
  
  return {
    totalMatches: matches.length,
    types: stats,
    hasSensitive: matches.length > 0,
  };
}

/**
 * 生成安全的图片代理URL
 */
export function generateProxyImageUrl(originalUrl: string): string {
  if (!originalUrl || !originalUrl.startsWith('http')) {
    return originalUrl;
  }
  
  // 将原始URL编码为Base64
  const encodedUrl = btoa(unescape(encodeURIComponent(originalUrl)));
  return `/api/proxy/image?url=${encodedUrl}`;
}

/**
 * 从代理URL中提取原始URL
 */
export function extractOriginalImageUrl(proxyUrl: string): string {
  try {
    const url = new URL(proxyUrl, window.location.origin);
    const encodedUrl = url.searchParams.get('url');
    if (!encodedUrl) return proxyUrl;
    
    return decodeURIComponent(escape(atob(encodedUrl)));
  } catch (error) {
    console.error('Error extracting original URL:', error);
    return proxyUrl;
  }
}

/**
 * 验证图片URL是否安全
 */
export function isImageUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // 只允许HTTPS（生产环境）
    if (parsed.protocol !== 'https:') {
      return false;
    }
    
    // 检查文件扩展名
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = validExtensions.some(ext => 
      parsed.pathname.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return false;
    }
    
    // 黑名单检查
    const blacklistedDomains = ['malicious.com', 'spam.net'];
    if (blacklistedDomains.includes(parsed.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * 清理HTML内容，移除潜在的安全风险
 */
export function sanitizeHtmlContent(html: string): string {
  // 移除脚本标签
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 移除事件处理器
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // 移除javascript: 链接
  sanitized = sanitized.replace(/javascript:[^"']*/gi, '');
  
  // 处理图片链接，使用代理
  sanitized = sanitized.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    if (isImageUrlSafe(src)) {
      const proxyUrl = generateProxyImageUrl(src);
      return match.replace(src, proxyUrl);
    } else {
      // 移除不安全的图片
      return '<!-- Unsafe image removed -->';
    }
  });
  
  return sanitized;
}