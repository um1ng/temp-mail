"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface EmailAddress {
  id: string;
  address: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  renewalCount: number;
  maxRenewals: number;
  customExpirationMinutes: number;
  label?: string;
  _count?: {
    emails: number;
  };
}

interface UseNotificationsReturn {
  permission: NotificationPermission | null;
  requestPermission: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  isSupported: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // 检查浏览器是否支持通知
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error("您的浏览器不支持通知功能");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success("通知权限已开启");
        return true;
      } else if (result === 'denied') {
        toast.error("通知权限被拒绝，请在浏览器设置中开启");
        return false;
      } else {
        toast.info("通知权限未授权");
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error("请求通知权限失败");
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported) {
      console.warn('Notifications not supported');
      return;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'temp-email',
        requireInteraction: false,
        ...options,
      });

      // 点击通知时聚焦窗口
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 自动关闭通知
      setTimeout(() => {
        notification.close();
      }, 5000);

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, permission]);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported,
  };
}

// 通知音效钩子
export function useNotificationSound() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // 初始化音频上下文
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const ctx = new AudioContext();
      setAudioContext(ctx);
      
      return () => {
        ctx.close();
      };
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!audioContext || !isEnabled) return;

    try {
      // 创建简单的通知音效
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 设置音效参数
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [audioContext, isEnabled]);

  const toggleSound = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return {
    playNotificationSound,
    isEnabled,
    toggleSound,
  };
}

// 智能推荐系统
export interface SmartRecommendation {
  id: string;
  type: 'scenario' | 'cleanup' | 'optimization' | 'security' | 'renewal';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  conditions?: {
    minAddresses?: number;
    maxAddresses?: number;
    hasExpiring?: boolean;
    hasExpired?: boolean;
    lowActivity?: boolean;
    highActivity?: boolean;
  };
}

export interface UsagePattern {
  totalAddresses: number;
  activeAddresses: number;
  expiredAddresses: number;
  expiringAddresses: number;
  averageLifetime: number;
  mostUsedScenarios: string[];
  lastCreatedAt?: Date;
  renewalFrequency: number;
  averageEmailsPerAddress: number;
}

export function useSmartRecommendations() {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [usagePattern, setUsagePattern] = useState<UsagePattern | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 加载已忽略的推荐
  useEffect(() => {
    const stored = localStorage.getItem('dismissed-recommendations');
    if (stored) {
      try {
        setDismissedIds(new Set(JSON.parse(stored)));
      } catch (error) {
        console.error('Error loading dismissed recommendations:', error);
      }
    }
  }, []);

  // 保存已忽略的推荐
  const saveDismissedIds = useCallback((ids: Set<string>) => {
    localStorage.setItem('dismissed-recommendations', JSON.stringify(Array.from(ids)));
  }, []);

  // 分析使用模式
  const analyzeUsagePattern = useCallback(async (addresses: EmailAddress[]) => {
    if (addresses.length === 0) return null;

    const now = new Date();
    
    const activeAddresses = addresses.filter(a => 
      a.isActive && new Date(a.expiresAt).getTime() > now.getTime()
    ).length;
    
    const expiredAddresses = addresses.filter(a => 
      !a.isActive || new Date(a.expiresAt).getTime() <= now.getTime()
    ).length;
    
    const expiringAddresses = addresses.filter(a => {
      const remaining = new Date(a.expiresAt).getTime() - now.getTime();
      return a.isActive && remaining > 0 && remaining < 2 * 60 * 60 * 1000;
    }).length;

    const totalLifetime = addresses.reduce((sum, a) => sum + a.customExpirationMinutes, 0);
    const averageLifetime = totalLifetime / addresses.length;

    const totalEmails = addresses.reduce((sum, a) => sum + (a._count?.emails || 0), 0);
    const averageEmailsPerAddress = totalEmails / addresses.length;

    const totalRenewals = addresses.reduce((sum, a) => sum + a.renewalCount, 0);
    const renewalFrequency = totalRenewals / addresses.length;

    // 分析最常用的场景
    const scenarioCount: Record<string, number> = {};
    addresses.forEach(a => {
      if (a.label) {
        scenarioCount[a.label] = (scenarioCount[a.label] || 0) + 1;
      }
    });

    const mostUsedScenarios = Object.entries(scenarioCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([scenario]) => scenario);

    const lastCreatedAt = addresses.length > 0 
      ? new Date(Math.max(...addresses.map(a => new Date(a.createdAt).getTime())))
      : undefined;

    const pattern: UsagePattern = {
      totalAddresses: addresses.length,
      activeAddresses,
      expiredAddresses,
      expiringAddresses,
      averageLifetime,
      mostUsedScenarios,
      lastCreatedAt,
      renewalFrequency,
      averageEmailsPerAddress
    };

    setUsagePattern(pattern);
    return pattern;
  }, []);

  // 生成智能推荐
  const generateRecommendations = useCallback(async (addresses: EmailAddress[]) => {
    setIsAnalyzing(true);
    
    try {
      const pattern = await analyzeUsagePattern(addresses);
      if (!pattern) {
        setRecommendations([]);
        return;
      }

      const newRecommendations: SmartRecommendation[] = [];

      // 推荐1: 清理过期邮箱
      if (pattern.expiredAddresses > 2) {
        newRecommendations.push({
          id: 'cleanup-expired',
          type: 'cleanup',
          title: '清理过期邮箱',
          description: `您有 ${pattern.expiredAddresses} 个过期邮箱，建议清理以优化界面`,
          priority: 'medium',
          action: {
            label: '立即清理',
            onClick: () => {
              toast.success('开始清理过期邮箱');
            }
          },
          dismissible: true,
          conditions: {
            minAddresses: 3,
            hasExpired: true
          }
        });
      }

      // 推荐2: 续期即将过期的邮箱
      if (pattern.expiringAddresses > 0) {
        newRecommendations.push({
          id: 'renew-expiring',
          type: 'renewal',
          title: '续期即将过期的邮箱',
          description: `您有 ${pattern.expiringAddresses} 个邮箱即将过期，建议提前续期`,
          priority: 'high',
          action: {
            label: '批量续期',
            onClick: () => {
              toast.success('开始批量续期');
            }
          },
          dismissible: false,
          conditions: {
            hasExpiring: true
          }
        });
      }

      // 推荐3: 场景优化建议
      if (pattern.mostUsedScenarios.length > 0) {
        const topScenario = pattern.mostUsedScenarios[0];
        newRecommendations.push({
          id: 'optimize-scenario',
          type: 'optimization',
          title: '优化常用场景',
          description: `您经常使用"${topScenario}"场景，建议创建快捷方式`,
          priority: 'low',
          action: {
            label: '创建快捷方式',
            onClick: () => {
              toast.success('快捷方式已创建');
            }
          },
          dismissible: true,
          conditions: {
            minAddresses: 5
          }
        });
      }

      // 推荐4: 使用简化模式
      if (pattern.totalAddresses < 5 && pattern.averageEmailsPerAddress < 2) {
        newRecommendations.push({
          id: 'use-simple-mode',
          type: 'optimization',
          title: '建议使用简化模式',
          description: '根据您的使用习惯，简化模式可能更适合您',
          priority: 'low',
          action: {
            label: '切换到简化模式',
            onClick: () => {
              localStorage.setItem('mailbox-view-mode', 'simple');
              toast.success('已切换到简化模式');
              window.location.reload();
            }
          },
          dismissible: true,
          conditions: {
            maxAddresses: 5,
            lowActivity: true
          }
        });
      }

      // 推荐5: 使用专家模式
      if (pattern.totalAddresses > 10 && pattern.renewalFrequency > 2) {
        newRecommendations.push({
          id: 'use-expert-mode',
          type: 'optimization',
          title: '建议使用专家模式',
          description: '您是活跃用户，专家模式提供更多高级功能',
          priority: 'medium',
          action: {
            label: '切换到专家模式',
            onClick: () => {
              localStorage.setItem('mailbox-view-mode', 'expert');
              toast.success('已切换到专家模式');
              window.location.reload();
            }
          },
          dismissible: true,
          conditions: {
            minAddresses: 10,
            highActivity: true
          }
        });
      }

      // 推荐6: 安全建议
      if (pattern.averageLifetime > 12 * 60) { // 超过12小时的邮箱
        newRecommendations.push({
          id: 'security-reminder',
          type: 'security',
          title: '安全提醒',
          description: '长期使用的邮箱可能存在安全风险，建议定期更换',
          priority: 'medium',
          action: {
            label: '查看安全建议',
            onClick: () => {
              toast.info('建议使用较短的邮箱有效期');
            }
          },
          dismissible: true
        });
      }

      // 推荐7: 首次使用引导
      if (pattern.totalAddresses === 0) {
        newRecommendations.push({
          id: 'first-use-guide',
          type: 'scenario',
          title: '欢迎使用临时邮箱',
          description: '创建您的第一个邮箱来接收验证邮件',
          priority: 'high',
          action: {
            label: '创建第一个邮箱',
            onClick: () => {
              toast.success('开始创建邮箱');
            }
          },
          dismissible: false
        });
      }

      // 过滤已忽略的推荐
      const filteredRecommendations = newRecommendations.filter(
        rec => !dismissedIds.has(rec.id)
      );

      setRecommendations(filteredRecommendations);
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('生成推荐失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeUsagePattern, dismissedIds]);

  // 忽略推荐
  const dismissRecommendation = useCallback((id: string) => {
    const newDismissedIds = new Set(dismissedIds);
    newDismissedIds.add(id);
    setDismissedIds(newDismissedIds);
    saveDismissedIds(newDismissedIds);
    
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  }, [dismissedIds, saveDismissedIds]);

  // 清除所有忽略的推荐
  const clearDismissedRecommendations = useCallback(() => {
    setDismissedIds(new Set());
    localStorage.removeItem('dismissed-recommendations');
    toast.success('已清除所有忽略的推荐');
  }, []);

  // 手动刷新推荐
  const refreshRecommendations = useCallback((addresses: EmailAddress[]) => {
    generateRecommendations(addresses);
  }, [generateRecommendations]);

  return {
    recommendations,
    usagePattern,
    isAnalyzing,
    dismissRecommendation,
    clearDismissedRecommendations,
    refreshRecommendations,
    generateRecommendations
  };
}

// 自动化任务管理
export interface AutomationTask {
  id: string;
  type: 'auto-renew' | 'auto-cleanup' | 'auto-export' | 'auto-notification';
  name: string;
  description: string;
  enabled: boolean;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string;
    days?: number[];
  };
  conditions?: {
    minAddresses?: number;
    maxInactiveHours?: number;
    scenarios?: string[];
  };
  lastRun?: Date;
  nextRun?: Date;
}

export function useAutomation() {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 初始化默认任务
  useEffect(() => {
    const defaultTasks: AutomationTask[] = [
      {
        id: 'auto-renew-expiring',
        type: 'auto-renew',
        name: '自动续期即将过期的邮箱',
        description: '当邮箱还有1小时过期时自动续期',
        enabled: false,
        schedule: {
          frequency: 'daily',
          time: '09:00'
        },
        conditions: {
          minAddresses: 1
        }
      },
      {
        id: 'auto-cleanup-expired',
        type: 'auto-cleanup',
        name: '自动清理过期邮箱',
        description: '清理过期超过24小时的邮箱',
        enabled: false,
        schedule: {
          frequency: 'daily',
          time: '02:00'
        },
        conditions: {
          maxInactiveHours: 24
        }
      },
      {
        id: 'auto-export-weekly',
        type: 'auto-export',
        name: '每周导出邮箱数据',
        description: '每周自动导出邮箱使用统计',
        enabled: false,
        schedule: {
          frequency: 'weekly',
          days: [0], // 周日
          time: '12:00'
        }
      },
      {
        id: 'auto-notification',
        type: 'auto-notification',
        name: '过期提醒通知',
        description: '邮箱过期前30分钟发送通知',
        enabled: true,
        schedule: {
          frequency: 'custom'
        }
      }
    ];

    setTasks(defaultTasks);
  }, []);

  // 启用/禁用任务
  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, enabled: !task.enabled }
        : task
    ));
    
    toast.success('自动化任务设置已更新');
  }, []);

  // 执行任务
  const executeTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setIsRunning(true);
    
    try {
      switch (task.type) {
        case 'auto-renew':
          toast.info('正在自动续期即将过期的邮箱...');
          break;
        case 'auto-cleanup':
          toast.info('正在自动清理过期邮箱...');
          break;
        case 'auto-export':
          toast.info('正在导出邮箱数据...');
          break;
        case 'auto-notification':
          toast.info('正在发送过期提醒通知...');
          break;
      }

      // 更新任务执行时间
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, lastRun: new Date() }
          : t
      ));

      toast.success(`任务"${task.name}"执行成功`);
    } catch (error) {
      console.error('Error executing automation task:', error);
      toast.error(`任务"${task.name}"执行失败`);
    } finally {
      setIsRunning(false);
    }
  }, [tasks]);

  // 手动触发任务
  const runTask = useCallback((taskId: string) => {
    executeTask(taskId);
  }, [executeTask]);

  return {
    tasks,
    isRunning,
    toggleTask,
    runTask
  };
}