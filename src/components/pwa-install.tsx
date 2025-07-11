"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Bell, 
  BellOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PWAInstallProps {
  onInstall?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstall({ onInstall }: PWAInstallProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [installPromptShown, setInstallPromptShown] = useState(false);

  // 检测PWA安装状态
  useEffect(() => {
    // 检查是否在PWA模式下运行
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   window.matchMedia('(display-mode: fullscreen)').matches ||
                   document.referrer.includes('android-app://');
    
    setIsInstalled(isInPWA);
    
    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 延迟显示安装提示
      setTimeout(() => {
        if (!isInPWA && !installPromptShown) {
          setInstallPromptShown(true);
          toast.info("将应用安装到桌面，获得更好的使用体验！", {
            action: {
              label: "安装",
              onClick: () => handleInstall()
            },
            duration: 10000
          });
        }
      }, 30000); // 30秒后显示
    };

    // 监听应用安装完成事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success("应用已成功安装到桌面！");
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [installPromptShown, onInstall]);

  // 监听网络状态
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        toast.success("网络连接已恢复");
      } else {
        toast.warning("网络连接已断开，正在使用离线模式");
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // 注册Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
          setSwRegistration(registration);
          
          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast.info("应用有新版本可用", {
                    action: {
                      label: "更新",
                      onClick: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                      }
                    }
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }

    // 检查通知权限
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // 安装PWA
  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error("安装提示不可用，请使用浏览器菜单安装");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast.success("正在安装应用...");
      } else {
        toast.info("您可以稍后通过浏览器菜单安装应用");
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('安装失败:', error);
      toast.error("安装失败，请稍后重试");
    }
  };

  // 请求通知权限
  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          toast.success("通知权限已开启");
          
          // 订阅推送通知
          if (swRegistration) {
            try {
              const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
              });
              
              // 发送订阅信息到服务器
              await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
              });
              
              toast.success("推送通知已设置");
            } catch (error) {
              console.error('推送订阅失败:', error);
            }
          }
        } else {
          toast.warning("通知权限被拒绝");
        }
      } catch (error) {
        console.error('请求通知权限失败:', error);
        toast.error("请求权限失败");
      }
    }
  };

  // 检查缓存状态
  const checkCacheStatus = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const totalSize = await Promise.all(
          cacheNames.map(async (name) => {
            const cache = await caches.open(name);
            const requests = await cache.keys();
            return requests.length;
          })
        );
        
        const totalCachedItems = totalSize.reduce((sum, count) => sum + count, 0);
        toast.info(`缓存状态: ${cacheNames.length} 个缓存，${totalCachedItems} 个项目`);
      } catch (error) {
        console.error('检查缓存失败:', error);
      }
    }
  };

  // 清理缓存
  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
        toast.success("缓存已清理");
      } catch (error) {
        console.error('清理缓存失败:', error);
        toast.error("清理缓存失败");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Smartphone className="w-4 h-4 mr-1" />
          PWA设置
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            PWA应用设置
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 安装状态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-4 h-4" />
                应用安装
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">安装状态</div>
                  <div className="text-sm text-muted-foreground">
                    {isInstalled ? "已安装到设备" : "未安装"}
                  </div>
                </div>
                <Badge variant={isInstalled ? "default" : "secondary"}>
                  {isInstalled ? (
                    <><CheckCircle className="w-3 h-3 mr-1" />已安装</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" />未安装</>
                  )}
                </Badge>
              </div>
              
              {!isInstalled && deferredPrompt && (
                <Button onClick={handleInstall} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  安装到桌面
                </Button>
              )}
              
              {!isInstalled && !deferredPrompt && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <div className="font-medium mb-1">手动安装说明：</div>
                      <ul className="space-y-1">
                        <li>• Chrome: 地址栏右侧安装图标</li>
                        <li>• Safari: 分享菜单 → 添加到主屏幕</li>
                        <li>• Edge: 设置菜单 → 应用 → 安装应用</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 网络状态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                网络状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">连接状态</div>
                  <div className="text-sm text-muted-foreground">
                    {isOnline ? "在线模式" : "离线模式"}
                  </div>
                </div>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "在线" : "离线"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 通知设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {notificationPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                通知设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">推送通知</div>
                  <div className="text-sm text-muted-foreground">
                    {notificationPermission === 'granted' && "已开启"}
                    {notificationPermission === 'denied' && "已拒绝"}
                    {notificationPermission === 'default' && "未设置"}
                  </div>
                </div>
                <Badge variant={
                  notificationPermission === 'granted' ? 'default' : 
                  notificationPermission === 'denied' ? 'destructive' : 'secondary'
                }>
                  {notificationPermission === 'granted' && "已开启"}
                  {notificationPermission === 'denied' && "已拒绝"}
                  {notificationPermission === 'default' && "未设置"}
                </Badge>
              </div>
              
              {notificationPermission !== 'granted' && (
                <Button 
                  onClick={handleRequestNotification} 
                  variant="outline" 
                  className="w-full"
                  disabled={notificationPermission === 'denied'}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {notificationPermission === 'denied' ? '权限被拒绝' : '开启通知'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 缓存管理 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                缓存管理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={checkCacheStatus} 
                  variant="outline" 
                  size="sm"
                >
                  检查缓存
                </Button>
                <Button 
                  onClick={clearCache} 
                  variant="outline" 
                  size="sm"
                >
                  清理缓存
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                离线缓存可让您在无网络时继续使用应用
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}