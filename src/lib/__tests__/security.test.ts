import {
  encryptContent,
  decryptContent,
  detectSensitiveInfo,
  maskSensitiveInfo,
  hasSensitiveInfo,
  getSensitiveInfoStats,
  generateProxyImageUrl,
  extractOriginalImageUrl,
  isImageUrlSafe,
  sanitizeHtmlContent,
} from '@/lib/security';

describe('Security Library', () => {
  describe('encryptContent and decryptContent', () => {
    test('should encrypt and decrypt content correctly', () => {
      const originalContent = 'Hello, this is a test message!';
      const encrypted = encryptContent(originalContent);
      const decrypted = decryptContent(encrypted);
      
      expect(encrypted).not.toBe(originalContent);
      expect(decrypted).toBe(originalContent);
    });

    test('should handle empty strings', () => {
      const encrypted = encryptContent('');
      const decrypted = decryptContent(encrypted);
      
      expect(decrypted).toBe('');
    });

    test('should handle unicode characters', () => {
      const originalContent = '测试中文内容 🚀 emoji';
      const encrypted = encryptContent(originalContent);
      const decrypted = decryptContent(encrypted);
      
      expect(decrypted).toBe(originalContent);
    });
  });

  describe('detectSensitiveInfo', () => {
    test('should detect credit card numbers', () => {
      const content = 'My credit card is 4532-1234-5678-9012';
      const matches = detectSensitiveInfo(content);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('creditCard');
      expect(matches[0].value).toBe('4532-1234-5678-9012');
    });

    test('should detect phone numbers', () => {
      const content = 'Call me at 13812345678';
      const matches = detectSensitiveInfo(content);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('phone');
      expect(matches[0].value).toBe('13812345678');
    });

    test('should detect email addresses', () => {
      const content = 'Send to user@example.com';
      const matches = detectSensitiveInfo(content);
      
      expect(matches).toHaveLength(1);
      expect(matches[0].type).toBe('email');
      expect(matches[0].value).toBe('user@example.com');
    });

    test('should detect multiple sensitive items', () => {
      const content = 'Card: 4532-1234-5678-9012, Phone: 13812345678, Email: test@domain.com';
      const matches = detectSensitiveInfo(content);
      
      expect(matches).toHaveLength(3);
      expect(matches.map(m => m.type)).toEqual(['creditCard', 'phone', 'email']);
    });

    test('should handle content with no sensitive information', () => {
      const content = 'This is just a normal message';
      const matches = detectSensitiveInfo(content);
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('maskSensitiveInfo', () => {
    test('should mask credit card numbers', () => {
      const content = 'Card: 4532-1234-5678-9012';
      const matches = detectSensitiveInfo(content);
      const masked = maskSensitiveInfo(content, matches);
      
      expect(masked).toContain('****-****-****-9012');
    });

    test('should mask phone numbers', () => {
      const content = 'Phone: 13812345678';
      const matches = detectSensitiveInfo(content);
      const masked = maskSensitiveInfo(content, matches);
      
      expect(masked).toContain('138****5678');
    });

    test('should mask email addresses', () => {
      const content = 'Email: user@example.com';
      const matches = detectSensitiveInfo(content);
      const masked = maskSensitiveInfo(content, matches);
      
      expect(masked).toContain('u**r@example.com');
    });

    test('should handle empty matches array', () => {
      const content = 'Normal content';
      const masked = maskSensitiveInfo(content, []);
      
      expect(masked).toBe(content);
    });
  });

  describe('hasSensitiveInfo and getSensitiveInfoStats', () => {
    test('should return true for content with sensitive info', () => {
      const content = 'My card is 4532-1234-5678-9012';
      
      expect(hasSensitiveInfo(content)).toBe(true);
    });

    test('should return false for content without sensitive info', () => {
      const content = 'Just normal text';
      
      expect(hasSensitiveInfo(content)).toBe(false);
    });

    test('should return correct statistics', () => {
      const content = 'Card: 4532-1234-5678-9012, Phone: 13812345678';
      const stats = getSensitiveInfoStats(content);
      
      expect(stats.totalMatches).toBe(2);
      expect(stats.hasSensitive).toBe(true);
      expect(stats.types.creditCard).toBe(1);
      expect(stats.types.phone).toBe(1);
    });
  });

  describe('generateProxyImageUrl and extractOriginalImageUrl', () => {
    test('should generate proxy URL correctly', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const proxyUrl = generateProxyImageUrl(originalUrl);
      
      expect(proxyUrl).toContain('/api/proxy/image?url=');
      expect(proxyUrl).not.toBe(originalUrl);
    });

    test('should handle non-HTTP URLs', () => {
      const originalUrl = 'data:image/png;base64,iVBOR...';
      const proxyUrl = generateProxyImageUrl(originalUrl);
      
      expect(proxyUrl).toBe(originalUrl);
    });

    test('should extract original URL from proxy URL', () => {
      const originalUrl = 'https://example.com/image.jpg';
      const proxyUrl = generateProxyImageUrl(originalUrl);
      
      // 需要 mock window.location 才能测试这个功能
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000'
        },
        writable: true
      });
      
      const extracted = extractOriginalImageUrl(proxyUrl);
      expect(extracted).toBe(originalUrl);
    });
  });

  describe('isImageUrlSafe', () => {
    test('should accept safe HTTPS URLs', () => {
      const url = 'https://example.com/image.jpg';
      
      expect(isImageUrlSafe(url)).toBe(true);
    });

    test('should reject HTTP URLs', () => {
      const url = 'http://example.com/image.jpg';
      
      expect(isImageUrlSafe(url)).toBe(false);
    });

    test('should reject URLs without valid extensions', () => {
      const url = 'https://example.com/notanimage';
      
      expect(isImageUrlSafe(url)).toBe(false);
    });

    test('should reject blacklisted domains', () => {
      const url = 'https://malicious.com/image.jpg';
      
      expect(isImageUrlSafe(url)).toBe(false);
    });

    test('should handle invalid URLs', () => {
      const url = 'not-a-url';
      
      expect(isImageUrlSafe(url)).toBe(false);
    });
  });

  describe('sanitizeHtmlContent', () => {
    test('should remove script tags', () => {
      const html = '<div>Safe content</div><script>alert("xss")</script>';
      const sanitized = sanitizeHtmlContent(html);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<div>Safe content</div>');
    });

    test('should remove event handlers', () => {
      const html = '<div onclick="alert(1)">Content</div>';
      const sanitized = sanitizeHtmlContent(html);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('<div>Content</div>');
    });

    test('should remove javascript: links', () => {
      const html = '<a href="javascript:alert(1)">Link</a>';
      const sanitized = sanitizeHtmlContent(html);
      
      expect(sanitized).not.toContain('javascript:');
    });

    test('should process image URLs', () => {
      const html = '<img src="https://example.com/image.jpg" alt="test">';
      const sanitized = sanitizeHtmlContent(html);
      
      expect(sanitized).toContain('/api/proxy/image');
    });

    test('should remove unsafe images', () => {
      const html = '<img src="http://malicious.com/bad.exe" alt="test">';
      const sanitized = sanitizeHtmlContent(html);
      
      expect(sanitized).toContain('<!-- Unsafe image removed -->');
    });
  });
});