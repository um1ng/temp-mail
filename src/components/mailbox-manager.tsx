"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, Clock, Copy, RefreshCw, Calendar, Users, Shield, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";

interface EmailAddress {
  id: string;
  address: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  renewalCount: number;
  maxRenewals: number;
  lastRenewalAt?: Date;
  warningsSent: number;
  autoRenewalEnabled: boolean;
  customExpirationMinutes: number;
  label?: string;
  _count?: {
    emails: number;
  };
}

interface MailboxTemplate {
  name: string;
  domain: string;
  duration: number; // 分钟
  description: string;
}

interface MailboxManagerProps {
  currentAddressId: string;
  onAddressSelect: (address: EmailAddress) => void;
  onAddressUpdate: (address: EmailAddress) => void;
}

const MAILBOX_TEMPLATES: MailboxTemplate[] = [
  {
    name: "快速验证",
    domain: "quick",
    duration: 15,
    description: "15分钟有效，适用于快速验证码接收"
  },
  {
    name: "标准注册",
    domain: "register",
    duration: 60,
    description: "1小时有效，适用于一般网站注册"
  },
  {
    name: "长期测试",
    domain: "test",
    duration: 720,
    description: "12小时有效，适用于应用测试"
  },
  {
    name: "自定义时长",
    domain: "custom",
    duration: 60,
    description: "自定义有效期"
  }
];

export function MailboxManager({ currentAddressId, onAddressSelect, onAddressUpdate }: MailboxManagerProps) {
  const [addresses, setAddresses] = useState<EmailAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("标准注册");
  const [customDuration, setCustomDuration] = useState(60);
  const [customLabel, setCustomLabel] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'expiring'>('active');
  const [sortBy, setSortBy] = useState<'created' | 'expires' | 'emails'>('created');

  // 获取所有邮箱地址
  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/addresses');
      if (!response.ok) throw new Error('Failed to fetch addresses');
      
      const data = await response.json();
      setAddresses(data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error("获取邮箱列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新邮箱
  const createMailbox = async () => {
    setIsLoading(true);
    try {
      const template = MAILBOX_TEMPLATES.find(t => t.name === selectedTemplate);
      const duration = selectedTemplate === "自定义时长" ? customDuration : template?.duration || 60;
      
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          expirationMinutes: duration,
          label: customLabel || selectedTemplate
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create mailbox');
      
      const data = await response.json();
      const newAddress = data.emailAddress;
      
      // 更新地址列表
      await fetchAddresses();
      
      // 选择新创建的邮箱
      onAddressSelect(newAddress);
      onAddressUpdate(newAddress);
      
      // 重置表单
      setShowCreateForm(false);
      setCustomLabel("");
      setSelectedTemplate("标准注册");
      setCustomDuration(60);
      
      toast.success("新邮箱已创建");
    } catch (error) {
      console.error('Error creating mailbox:', error);
      toast.error("创建邮箱失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 续期邮箱
  const renewMailbox = async (addressId: string) => {
    try {
      const response = await fetch(`/api/addresses/${addressId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalMinutes: 60 }),
      });
      
      if (!response.ok) throw new Error('Failed to renew mailbox');
      
      await fetchAddresses();
      toast.success("邮箱已续期1小时");
    } catch (error) {
      console.error('Error renewing mailbox:', error);
      toast.error("续期失败");
    }
  };

  // 复制邮箱地址
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("邮箱地址已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  // 格式化剩余时间
  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const remaining = new Date(expiresAt).getTime() - now.getTime();
    
    if (remaining <= 0) return "已过期";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  // 获取状态颜色
  const getStatusColor = (address: EmailAddress) => {
    if (!address.isActive) return "destructive";
    
    const now = new Date();
    const remaining = new Date(address.expiresAt).getTime() - now.getTime();
    const totalDuration = address.customExpirationMinutes * 60 * 1000;
    const timeRatio = remaining / totalDuration;
    
    if (timeRatio > 0.5) return "default";
    if (timeRatio > 0.2) return "secondary";
    return "destructive";
  };

  // 获取状态文本
  const getStatusText = (address: EmailAddress) => {
    if (!address.isActive) return "已停用";
    
    const now = new Date();
    const remaining = new Date(address.expiresAt).getTime() - now.getTime();
    
    if (remaining <= 0) return "已过期";
    
    const totalDuration = address.customExpirationMinutes * 60 * 1000;
    const timeRatio = remaining / totalDuration;
    
    if (timeRatio > 0.5) return "正常";
    if (timeRatio > 0.2) return "即将过期";
    return "紧急";
  };

  // 筛选和排序邮箱
  const filteredAndSortedAddresses = addresses
    .filter(address => {
      const now = new Date();
      const remaining = new Date(address.expiresAt).getTime() - now.getTime();
      
      switch (filterStatus) {
        case 'all':
          return true;
        case 'active':
          return address.isActive && remaining > 0;
        case 'expired':
          return !address.isActive || remaining <= 0;
        case 'expiring':
          return address.isActive && remaining > 0 && remaining < 2 * 60 * 60 * 1000; // 2小时内过期
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'expires':
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        case 'emails':
          return (b._count?.emails || 0) - (a._count?.emails || 0);
        default:
          return 0;
      }
    });

  // 获取统计信息
  const getStatistics = () => {
    const now = new Date();
    const total = addresses.length;
    const active = addresses.filter(a => a.isActive && new Date(a.expiresAt).getTime() > now.getTime()).length;
    const expired = addresses.filter(a => !a.isActive || new Date(a.expiresAt).getTime() <= now.getTime()).length;
    const expiring = addresses.filter(a => {
      const remaining = new Date(a.expiresAt).getTime() - now.getTime();
      return a.isActive && remaining > 0 && remaining < 2 * 60 * 60 * 1000;
    }).length;
    const totalEmails = addresses.reduce((sum, a) => sum + (a._count?.emails || 0), 0);
    
    return { total, active, expired, expiring, totalEmails };
  };

  const stats = getStatistics();

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div className="space-y-6">
      {/* 头部和统计信息 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            邮箱管理器
          </h3>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建邮箱
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">总邮箱</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">活跃中</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
                <p className="text-xs text-muted-foreground">即将过期</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">已过期</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalEmails}</p>
                <p className="text-xs text-muted-foreground">总邮件</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 筛选和排序工具栏 */}
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">筛选:</Label>
              <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'expired' | 'expiring') => setFilterStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃中</SelectItem>
                  <SelectItem value="expiring">即将过期</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">排序:</Label>
              <Select value={sortBy} onValueChange={(value: 'created' | 'expires' | 'emails') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">创建时间</SelectItem>
                  <SelectItem value="expires">过期时间</SelectItem>
                  <SelectItem value="emails">邮件数量</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAddresses}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>
      </div>

      {/* 创建邮箱表单 */}
      {showCreateForm && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">创建新邮箱</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>邮箱模板</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAILBOX_TEMPLATES.map((template) => (
                      <SelectItem key={template.name} value={template.name}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTemplate === "自定义时长" && (
                <div>
                  <Label>有效期（分钟）</Label>
                  <Input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    min={5}
                    max={1440}
                  />
                </div>
              )}
            </div>
            
            <div>
              <Label>标签（可选）</Label>
              <Input
                placeholder="为这个邮箱添加标签..."
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                取消
              </Button>
              <Button onClick={createMailbox} disabled={isLoading}>
                {isLoading ? "创建中..." : "创建邮箱"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 邮箱列表 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            显示 {filteredAndSortedAddresses.length} 个邮箱
          </p>
        </div>
        
        {filteredAndSortedAddresses.map((address) => (
          <Card 
            key={address.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              address.id === currentAddressId 
                ? 'ring-2 ring-primary bg-primary/5 shadow-md' 
                : 'hover:bg-muted/30'
            }`}
            onClick={() => {
              onAddressSelect(address);
              onAddressUpdate(address);
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-3">
                  {/* 邮箱地址和复制按钮 */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-sm truncate font-medium">
                        {address.address}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAddress(address.address);
                      }}
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* 标签 */}
                  {address.label && (
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {address.label}
                      </Badge>
                    </div>
                  )}
                  
                  {/* 详细信息 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <div>
                        <p className="font-medium">剩余时间</p>
                        <p>{formatTimeRemaining(address.expiresAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <div>
                        <p className="font-medium">邮件数量</p>
                        <p>{address._count?.emails || 0} 封</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <div>
                        <p className="font-medium">续期次数</p>
                        <p>{address.renewalCount}/{address.maxRenewals}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="font-medium">创建时间</p>
                        <p>{new Date(address.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 状态和操作 */}
                <div className="flex flex-col items-end gap-3">
                  <Badge variant={getStatusColor(address)} className="font-medium">
                    {getStatusText(address)}
                  </Badge>
                  
                  {address.isActive && address.renewalCount < address.maxRenewals && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        renewMailbox(address.id);
                      }}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      续期1小时
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredAndSortedAddresses.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {filterStatus === 'all' ? '暂无邮箱' : `暂无${filterStatus === 'active' ? '活跃' : filterStatus === 'expired' ? '过期' : '即将过期'}的邮箱`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {filterStatus === 'all' 
                  ? '点击"新建邮箱"创建您的第一个临时邮箱' 
                  : '尝试切换到其他筛选条件或创建新邮箱'
                }
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                新建邮箱
              </Button>
            </CardContent>
          </Card>
        )}
        
        {isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="w-10 h-10 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">正在加载邮箱列表...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}