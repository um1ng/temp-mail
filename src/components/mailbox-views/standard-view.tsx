"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioTemplate } from "../enhanced-mailbox-manager";
import { 
  Plus, 
  Mail, 
  Copy, 
  Clock, 
  Users, 
  Shield, 
  Trash2, 
  Filter,
  RefreshCw,
  Calendar,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface StandardMailboxViewProps {
  addresses: EmailAddress[];
  currentAddressId: string;
  isLoading: boolean;
  onAddressSelect: (address: EmailAddress) => void;
  onAddressUpdate: (address: EmailAddress) => void;
  onRefresh: () => void;
  onCreateScenario: (template: ScenarioTemplate, customLabel?: string) => Promise<void>;
  scenarios: ScenarioTemplate[];
}

export function StandardMailboxView({ 
  addresses, 
  currentAddressId, 
  isLoading, 
  onAddressSelect, 
  onRefresh,
  onCreateScenario,
  scenarios 
}: StandardMailboxViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'expiring'>('active');
  const [sortBy, setSortBy] = useState<'created' | 'expires' | 'emails'>('created');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioTemplate>(scenarios[0]);
  const [isCreating, setIsCreating] = useState(false);

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
          return address.isActive && remaining > 0 && remaining < 2 * 60 * 60 * 1000;
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

  // 复制邮箱地址
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("邮箱地址已复制");
    } catch {
      toast.error("复制失败");
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
      
      await onRefresh();
      toast.success("邮箱已续期1小时");
    } catch (error) {
      console.error('Error renewing mailbox:', error);
      toast.error("续期失败");
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

  // 创建场景邮箱
  const handleCreateScenario = async () => {
    setIsCreating(true);
    try {
      await onCreateScenario(selectedScenario);
      setShowCreateDialog(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">筛选:</span>
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
            <span className="text-sm">排序:</span>
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
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                新建邮箱
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>创建新邮箱</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {scenarios.map((scenario) => (
                    <Card 
                      key={scenario.id}
                      className={`cursor-pointer transition-all ${
                        selectedScenario.id === scenario.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded ${scenario.color} flex items-center justify-center text-lg`}>
                            {scenario.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{scenario.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {scenario.duration >= 60 
                                ? `${Math.floor(scenario.duration / 60)}小时` 
                                : `${scenario.duration}分钟`
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedScenario && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">{selectedScenario.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{selectedScenario.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">自动功能:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedScenario.autoFeatures.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateScenario} disabled={isCreating}>
                    {isCreating ? "创建中..." : "创建邮箱"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
            onClick={() => onAddressSelect(address)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-3">
                  {/* 邮箱地址和复制按钮 */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <div>
                        <p className="font-medium">剩余时间</p>
                        <p>{formatTimeRemaining(address.expiresAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <div>
                        <p className="font-medium">邮件数量</p>
                        <p>{address._count?.emails || 0} 封</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}