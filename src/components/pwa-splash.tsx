"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";

export function PWASplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 检查是否在PWA模式下运行
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   window.matchMedia('(display-mode: fullscreen)').matches ||
                   document.referrer.includes('android-app://');
    
    if (!isInPWA) {
      setIsVisible(false);
      return;
    }

    // 最短显示时间
    const minDisplayTime = 1500;
    const startTime = Date.now();

    // 等待应用加载完成
    const checkLoaded = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      setTimeout(() => {
        setIsVisible(false);
      }, remainingTime);
    };

    // 监听页面加载完成
    if (document.readyState === 'complete') {
      checkLoaded();
    } else {
      window.addEventListener('load', checkLoaded);
      return () => window.removeEventListener('load', checkLoaded);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="pwa-splash">
      <div className="pwa-splash-content">
        <div className="pwa-splash-logo">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="pwa-splash-title">临时邮箱</h1>
        <p className="pwa-splash-subtitle">安全便捷的邮件服务</p>
      </div>
    </div>
  );
}