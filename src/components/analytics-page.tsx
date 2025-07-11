import React from 'react';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Mail,
  Globe,
  Activity,
  ArrowLeft
} from 'lucide-react';

interface AnalyticsPageProps {
  onBack: () => void;
}

export function AnalyticsPage({ onBack }: AnalyticsPageProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 头部导航 */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">数据分析</h1>
        </div>
      </div>

      {/* 分析仪表板 */}
      <div className="flex-1 overflow-auto p-4">
        <AnalyticsDashboard />
      </div>
    </div>
  );
}

// 快速统计卡片组件
interface QuickStatsProps {
  totalEmails: number;
  todayEmails: number;
  activeMailboxes: number;
  topSender: string;
}

export function QuickStats({ totalEmails, todayEmails, activeMailboxes, topSender }: QuickStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总邮件数</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmails}</div>
          <p className="text-xs text-muted-foreground">
            今日新增 {todayEmails} 封
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">活跃邮箱</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeMailboxes}</div>
          <p className="text-xs text-muted-foreground">
            正在使用中
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">热门发件人</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-bold truncate">{topSender}</div>
          <p className="text-xs text-muted-foreground">
            发送最多邮件
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">使用活跃度</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">高</div>
          <p className="text-xs text-muted-foreground">
            近期访问频繁
          </p>
        </CardContent>
      </Card>
    </div>
  );
}