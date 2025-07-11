"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Mail, 
  Clock, 
  Users,
  Globe,
  Activity,
  Zap,
  Download
} from "lucide-react"

interface AnalyticsData {
  emailStats: {
    totalEmails: number
    todayEmails: number
    weeklyEmails: number
    monthlyEmails: number
    averagePerDay: number
  }
  senderStats: {
    topSenders: Array<{
      domain: string
      count: number
      percentage: number
    }>
    totalSenders: number
    uniqueDomains: number
  }
  categoryStats: {
    verification: number
    notification: number
    marketing: number
    security: number
    other: number
  }
  timeStats: {
    hourlyDistribution: Array<{
      hour: number
      count: number
    }>
    dailyTrend: Array<{
      date: string
      count: number
    }>
  }
  mailboxStats: {
    activeMailboxes: number
    totalMailboxes: number
    averageLifetime: number
    extensionCount: number
  }
  usageStats: {
    searchQueries: number
    exportCount: number
    forwardCount: number
    shareCount: number
    batchOperations: number
  }
}

interface AnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d'
  className?: string
}

export function AnalyticsDashboard({ timeRange = '7d', className }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?period=${selectedTimeRange}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      // 使用模拟数据作为fallback
      setData(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): AnalyticsData => ({
    emailStats: {
      totalEmails: 156,
      todayEmails: 23,
      weeklyEmails: 89,
      monthlyEmails: 156,
      averagePerDay: 12.3
    },
    senderStats: {
      topSenders: [
        { domain: 'github.com', count: 45, percentage: 28.8 },
        { domain: 'google.com', count: 32, percentage: 20.5 },
        { domain: 'microsoft.com', count: 28, percentage: 17.9 },
        { domain: 'apple.com', count: 19, percentage: 12.2 },
        { domain: 'other', count: 32, percentage: 20.5 }
      ],
      totalSenders: 67,
      uniqueDomains: 34
    },
    categoryStats: {
      verification: 68,
      notification: 45,
      marketing: 23,
      security: 12,
      other: 8
    },
    timeStats: {
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 15) + 1
      })),
      dailyTrend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 25) + 5
      })).reverse()
    },
    mailboxStats: {
      activeMailboxes: 3,
      totalMailboxes: 8,
      averageLifetime: 45,
      extensionCount: 12
    },
    usageStats: {
      searchQueries: 34,
      exportCount: 8,
      forwardCount: 5,
      shareCount: 3,
      batchOperations: 15
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">无法加载分析数据</p>
        <Button onClick={fetchAnalyticsData} className="mt-4">
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">使用数据分析</h2>
          <p className="text-muted-foreground">了解您的邮箱使用情况和趋势</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={(value: '7d' | '30d' | '90d') => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="emails">邮件分析</TabsTrigger>
          <TabsTrigger value="usage">使用统计</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总邮件数</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.emailStats.totalEmails}</div>
                <p className="text-xs text-muted-foreground">
                  今日新增 {data.emailStats.todayEmails} 封
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃邮箱</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.mailboxStats.activeMailboxes}</div>
                <p className="text-xs text-muted-foreground">
                  总计 {data.mailboxStats.totalMailboxes} 个邮箱
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">发件人域名</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.senderStats.uniqueDomains}</div>
                <p className="text-xs text-muted-foreground">
                  来自 {data.senderStats.totalSenders} 个发件人
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均使用时长</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.mailboxStats.averageLifetime}分钟</div>
                <p className="text-xs text-muted-foreground">
                  续期 {data.mailboxStats.extensionCount} 次
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>邮件分类统计</CardTitle>
                <CardDescription>按类型统计邮件数量</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">验证码</Badge>
                    <span className="text-sm">{data.categoryStats.verification}</span>
                  </div>
                  <Progress value={(data.categoryStats.verification / data.emailStats.totalEmails) * 100} className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">通知</Badge>
                    <span className="text-sm">{data.categoryStats.notification}</span>
                  </div>
                  <Progress value={(data.categoryStats.notification / data.emailStats.totalEmails) * 100} className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">营销</Badge>
                    <span className="text-sm">{data.categoryStats.marketing}</span>
                  </div>
                  <Progress value={(data.categoryStats.marketing / data.emailStats.totalEmails) * 100} className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">安全</Badge>
                    <span className="text-sm">{data.categoryStats.security}</span>
                  </div>
                  <Progress value={(data.categoryStats.security / data.emailStats.totalEmails) * 100} className="w-24" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>使用功能统计</CardTitle>
                <CardDescription>各功能使用次数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">搜索查询</span>
                  </div>
                  <Badge variant="outline">{data.usageStats.searchQueries}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="text-sm">导出邮件</span>
                  </div>
                  <Badge variant="outline">{data.usageStats.exportCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">转发邮件</span>
                  </div>
                  <Badge variant="outline">{data.usageStats.forwardCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">批量操作</span>
                  </div>
                  <Badge variant="outline">{data.usageStats.batchOperations}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>热门发件人域名</CardTitle>
              <CardDescription>按邮件数量排序的发件人域名</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.senderStats.topSenders.map((sender, index) => (
                  <div key={sender.domain} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{sender.domain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{sender.count} 封</span>
                      <Progress value={sender.percentage} className="w-20" />
                      <span className="text-sm font-mono">{sender.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>邮箱管理统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>活跃邮箱</span>
                  <span className="font-bold">{data.mailboxStats.activeMailboxes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>历史邮箱总数</span>
                  <span className="font-bold">{data.mailboxStats.totalMailboxes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>平均使用时长</span>
                  <span className="font-bold">{data.mailboxStats.averageLifetime} 分钟</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>续期次数</span>
                  <span className="font-bold">{data.mailboxStats.extensionCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>每日邮件趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.timeStats.dailyTrend.map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(day.count / Math.max(...data.timeStats.dailyTrend.map(d => d.count))) * 100} className="w-16" />
                        <span className="text-sm font-mono w-8">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24小时活动分布</CardTitle>
              <CardDescription>邮件接收时间分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-1 mt-4">
                {data.timeStats.hourlyDistribution.map((hour) => (
                  <div key={hour.hour} className="flex flex-col items-center">
                    <div 
                      className="w-full bg-primary/20 rounded-sm mb-1"
                      style={{ 
                        height: `${Math.max((hour.count / Math.max(...data.timeStats.hourlyDistribution.map(h => h.count))) * 60, 4)}px` 
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{hour.hour}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0:00</span>
                <span>6:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}