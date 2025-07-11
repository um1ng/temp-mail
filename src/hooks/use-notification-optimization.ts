import { useState, useCallback, useRef, useEffect } from 'react';

interface NotificationOptimization {
  isSupported: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  enableBatching: boolean;
  setEnableBatching: (enabled: boolean) => void;
  notificationQueue: NotificationData[];
  clearQueue: () => void;
}

interface NotificationData {
  id: string;
  title: string;
  options?: NotificationOptions;
  timestamp: number;
}

interface NotificationSettings {
  enableSound?: boolean;
  enableVibration?: boolean;
  enableBatching?: boolean;
  batchDelay?: number;
  maxQueueSize?: number;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function useNotificationOptimization(
  settings: NotificationSettings = {}
): NotificationOptimization {
  const {
    enableSound = true,
    enableVibration = true,
    enableBatching = true,
    batchDelay = 5000,
    maxQueueSize = 10,
    quietHours = { enabled: false, start: '22:00', end: '08:00' }
  } = settings;

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [enableBatchingState, setEnableBatching] = useState(enableBatching);
  const [notificationQueue, setNotificationQueue] = useState<NotificationData[]>([]);
  
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // 初始化通知权限状态
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, [isSupported]);

  // 检查是否在静默时间
  const isQuietHours = useCallback(() => {
    if (!quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime = parseInt(quietHours.start.replace(':', ''));
    const endTime = parseInt(quietHours.end.replace(':', ''));
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 跨午夜的情况
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [quietHours]);

  // 请求通知权限
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsEnabled(result === 'granted');
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // 发送单个通知
  const sendSingleNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted' || isQuietHours()) {
      return;
    }

    const notificationOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'email-notification',
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, notificationOptions);
      
      // 音效支持
      if (enableSound && 'vibrate' in navigator) {
        // 简单的声音提示（通过振动模拟）
        navigator.vibrate([100, 50, 100]);
      }
      
      // 振动支持
      if (enableVibration && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }

      // 自动关闭通知
      setTimeout(() => {
        notification.close();
      }, 5000);

      // 点击事件
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [isSupported, permission, isQuietHours, enableSound, enableVibration]);

  // 批量发送通知
  const processBatchedNotifications = useCallback(() => {
    if (notificationQueue.length === 0) return;

    if (notificationQueue.length === 1) {
      const notification = notificationQueue[0];
      sendSingleNotification(notification.title, notification.options);
    } else {
      // 合并多个通知
      const count = notificationQueue.length;
      const latestNotification = notificationQueue[notificationQueue.length - 1];
      
      sendSingleNotification(
        `您有 ${count} 封新邮件`,
        {
          body: `最新：${latestNotification.title}`,
          ...latestNotification.options
        }
      );
    }

    setNotificationQueue([]);
  }, [notificationQueue, sendSingleNotification]);

  // 发送通知（支持批量处理）
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    if (!enableBatchingState) {
      sendSingleNotification(title, options);
      return;
    }

    // 添加到队列
    const notificationData: NotificationData = {
      id: Date.now().toString(),
      title,
      options,
      timestamp: Date.now()
    };

    setNotificationQueue(prev => {
      const newQueue = [...prev, notificationData].slice(-maxQueueSize);
      
      // 重置批量定时器
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      
      batchTimerRef.current = setTimeout(() => {
        processBatchedNotifications();
      }, batchDelay);
      
      return newQueue;
    });
  }, [
    isSupported, 
    permission, 
    enableBatchingState, 
    sendSingleNotification, 
    maxQueueSize, 
    batchDelay, 
    processBatchedNotifications
  ]);

  // 清空通知队列
  const clearQueue = useCallback(() => {
    setNotificationQueue([]);
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  return {
    isSupported,
    permission,
    isEnabled,
    requestPermission,
    sendNotification,
    enableBatching: enableBatchingState,
    setEnableBatching,
    notificationQueue,
    clearQueue
  };
}

// 通知性能监控
export function useNotificationPerformance() {
  const [metrics, setMetrics] = useState({
    totalSent: 0,
    totalClicked: 0,
    clickRate: 0,
    averageDisplayTime: 0,
    quietHoursBlocked: 0
  });

  const trackNotificationSent = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      totalSent: prev.totalSent + 1
    }));
  }, []);

  const trackNotificationClicked = useCallback(() => {
    setMetrics(prev => {
      const newClicked = prev.totalClicked + 1;
      return {
        ...prev,
        totalClicked: newClicked,
        clickRate: (newClicked / prev.totalSent) * 100
      };
    });
  }, []);

  const trackQuietHoursBlocked = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      quietHoursBlocked: prev.quietHoursBlocked + 1
    }));
  }, []);

  return {
    metrics,
    trackNotificationSent,
    trackNotificationClicked,
    trackQuietHoursBlocked
  };
}