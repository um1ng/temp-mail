import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Download, 
  Bell, 
  Zap, 
  Globe,
  RefreshCw,
  CheckCircle,
  Wifi,
  Monitor,
  Settings
} from 'lucide-react';

interface PWAOptimizationProps {
  onInstallClick?: () => void;
  isInstalled?: boolean;
  isOnline?: boolean;
}

export function PWAOptimization({ 
  onInstallClick, 
  isInstalled = false, 
  isOnline = true 
}: PWAOptimizationProps) {
  return (
    <div className="space-y-6">
      {/* PWA 状态概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            PWA 应用状态
          </CardTitle>
          <CardDescription>
            Progressive Web App 功能状态和优化建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm">应用安装状态</span>
              </div>
              <Badge variant={isInstalled ? "default" : "secondary"}>
                {isInstalled ? "已安装" : "未安装"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                <span className="text-sm">网络状态</span>
              </div>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "在线" : "离线"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm">推送通知</span>
              </div>
              <Badge variant="default">
                已启用
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">离线缓存</span>
              </div>
              <Badge variant="default">
                已启用
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 安装指引 */}
      {!isInstalled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              安装应用到设备
            </CardTitle>
            <CardDescription>
              将临时邮箱安装到您的设备，享受原生应用体验
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">离线访问历史邮件</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">原生推送通知</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">快速启动和全屏体验</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">手势操作和触摸优化</span>
              </div>
            </div>
            
            <Button 
              onClick={onInstallClick}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              安装应用
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 性能优化 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            性能优化状态
          </CardTitle>
          <CardDescription>
            应用性能和用户体验优化指标
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">首屏加载速度</span>
              <div className="flex items-center gap-2">
                <Progress value={85} className="w-20" />
                <Badge variant="default">优秀</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">离线缓存覆盖</span>
              <div className="flex items-center gap-2">
                <Progress value={92} className="w-20" />
                <Badge variant="default">优秀</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">响应式设计</span>
              <div className="flex items-center gap-2">
                <Progress value={95} className="w-20" />
                <Badge variant="default">优秀</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">手势操作</span>
              <div className="flex items-center gap-2">
                <Progress value={88} className="w-20" />
                <Badge variant="default">良好</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 移动端优化建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            移动端体验优化
          </CardTitle>
          <CardDescription>
            基于当前使用情况的优化建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">下拉刷新已启用</p>
              <p className="text-xs text-muted-foreground">
                在邮件列表顶部下拉可刷新邮件
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">滑动操作已优化</p>
              <p className="text-xs text-muted-foreground">
                左滑删除，右滑归档邮件
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">触摸反馈已启用</p>
              <p className="text-xs text-muted-foreground">
                操作时提供触觉反馈和视觉提示
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 更新检查 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            应用更新
          </CardTitle>
          <CardDescription>
            检查并安装最新版本
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">当前版本: v1.0.0</p>
              <p className="text-xs text-muted-foreground">最后检查: 刚刚</p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              检查更新
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}