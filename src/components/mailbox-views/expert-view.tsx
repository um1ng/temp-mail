"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScenarioTemplate } from "../enhanced-mailbox-manager";
import { 
  Plus, 
  Mail, 
  Copy, 
  Clock, 
  Filter,
  RefreshCw,
  Zap,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

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

interface ExpertMailboxViewProps {
  addresses: EmailAddress[];
  currentAddressId: string;
  isLoading: boolean;
  onAddressSelect: (address: EmailAddress) => void;
  onAddressUpdate: (address: EmailAddress) => void;
  onRefresh: () => void;
  onCreateScenario: (template: ScenarioTemplate, customLabel?: string) => Promise<void>;
  scenarios: ScenarioTemplate[];
}

export function ExpertMailboxView({ 
  addresses, 
  currentAddressId, 
  isLoading, 
  onAddressSelect, 
  onRefresh,
  scenarios 
}: ExpertMailboxViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'expires' | 'emails' | 'renewals'>('created');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // 自定义创建表单状态
  const [customSettings, setCustomSettings] = useState({
    domain: '',
    expirationMinutes: 60,
    maxRenewals: 3,
    autoRenewalEnabled: false,
    label: '',
    scenario: scenarios[0]?.id || '',
    customDomain: false
  });

  // 获取高级统计信息
  const getAdvancedStatistics = () => {
    const now = new Date();
    const total = addresses.length;
    const active = addresses.filter(a => a.isActive && new Date(a.expiresAt).getTime() > now.getTime()).length;
    const expired = addresses.filter(a => !a.isActive || new Date(a.expiresAt).getTime() <= now.getTime()).length;
    const expiring = addresses.filter(a => {
      const remaining = new Date(a.expiresAt).getTime() - now.getTime();
      return a.isActive && remaining > 0 && remaining < 2 * 60 * 60 * 1000;
    }).length;
    const totalEmails = addresses.reduce((sum, a) => sum + (a._count?.emails || 0), 0);
    const totalRenewals = addresses.reduce((sum, a) => sum + a.renewalCount, 0);
    const avgLifetime = addresses.length > 0 
      ? addresses.reduce((sum, a) => sum + a.customExpirationMinutes, 0) / addresses.length 
      : 0;
    const autoRenewalEnabled = addresses.filter(a => a.autoRenewalEnabled).length;
    
    return { 
      total, 
      active, 
      expired, 
      expiring, 
      totalEmails, 
      totalRenewals, 
      avgLifetime: Math.round(avgLifetime),
      autoRenewalEnabled 
    };
  };

  const stats = getAdvancedStatistics();

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
        case 'renewals':
          return b.renewalCount - a.renewalCount;
        default:
          return 0;
      }
    });

  // 批量操作相关
  const toggleAddressSelection = (addressId: string) => {
    const newSelected = new Set(selectedAddresses);
    if (newSelected.has(addressId)) {
      newSelected.delete(addressId);
    } else {
      newSelected.add(addressId);
    }
    setSelectedAddresses(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAddresses.size === filteredAndSortedAddresses.length) {
      setSelectedAddresses(new Set());
    } else {
      setSelectedAddresses(new Set(filteredAndSortedAddresses.map(a => a.id)));
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

  // 批量续期
  const batchRenewMailboxes = async () => {
    if (selectedAddresses.size === 0) return;
    
    try {
      const promises = Array.from(selectedAddresses).map(id => 
        fetch(`/api/addresses/${id}/renew`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ additionalMinutes: 60 }),
        })
      );
      
      await Promise.all(promises);
      await onRefresh();
      setSelectedAddresses(new Set());
      toast.success(`已续期 ${selectedAddresses.size} 个邮箱`);
    } catch (error) {
      console.error('Error batch renewing mailboxes:', error);
      toast.error("批量续期失败");
    }
  };

  // 导出邮箱列表
  const exportMailboxes = async () => {
    const data = filteredAndSortedAddresses.map(addr => ({
      address: addr.address,
      label: addr.label || '',
      created: new Date(addr.createdAt).toLocaleString(),
      expires: new Date(addr.expiresAt).toLocaleString(),
      status: addr.isActive ? '活跃' : '过期',
      emails: addr._count?.emails || 0,
      renewals: addr.renewalCount
    }));
    
    const csv = [
      ['邮箱地址', '标签', '创建时间', '过期时间', '状态', '邮件数', '续期次数'],
      ...data.map(row => [row.address, row.label, row.created, row.expires, row.status, row.emails, row.renewals])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mailboxes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("邮箱列表已导出");
  };

  // 格式化剩余时间
  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const remaining = new Date(expiresAt).getTime() - now.getTime();
    
    if (remaining <= 0) return "已过期";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // 获取状态样式
  const getStatusBadge = (address: EmailAddress) => {
    if (!address.isActive) return <Badge variant="destructive">已停用</Badge>;
    
    const now = new Date();
    const remaining = new Date(address.expiresAt).getTime() - now.getTime();
    
    if (remaining <= 0) return <Badge variant="destructive">已过期</Badge>;
    
    const totalDuration = address.customExpirationMinutes * 60 * 1000;
    const timeRatio = remaining / totalDuration;
    
    if (timeRatio > 0.5) return <Badge variant="default">正常</Badge>;
    if (timeRatio > 0.2) return <Badge variant="secondary">即将过期</Badge>;
    return <Badge variant="destructive">紧急</Badge>;
  };

  // 创建自定义邮箱
  const handleCreateCustomMailbox = async () => {
    setIsCreating(true);
    try {
      const selectedScenario = scenarios.find(s => s.id === customSettings.scenario);
      if (!selectedScenario) throw new Error('Invalid scenario');
      
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expirationMinutes: customSettings.expirationMinutes,
          label: customSettings.label,
          scenario: customSettings.scenario,
          autoRenewalEnabled: customSettings.autoRenewalEnabled,
          maxRenewals: customSettings.maxRenewals,
          customDomain: customSettings.customDomain ? customSettings.domain : undefined
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create mailbox');
      
      const data = await response.json();
      await onRefresh();
      onAddressSelect(data.emailAddress);
      setShowCreateDialog(false);
      toast.success("自定义邮箱已创建");
    } catch (error) {
      console.error('Error creating custom mailbox:', error);
      toast.error("创建邮箱失败");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 高级统计面板 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">总数</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-muted-foreground">活跃</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xl font-bold text-orange-600">{stats.expiring}</p>
              <p className="text-xs text-muted-foreground">将过期</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-xs text-muted-foreground">已过期</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xl font-bold text-purple-600">{stats.totalEmails}</p>
              <p className="text-xs text-muted-foreground">总邮件</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-500" />
            <div>
              <p className="text-xl font-bold text-cyan-600">{stats.totalRenewals}</p>
              <p className="text-xs text-muted-foreground">总续期</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xl font-bold text-amber-600">{stats.avgLifetime}</p>
              <p className="text-xs text-muted-foreground">平均时长(分)</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-xl font-bold text-indigo-600">{stats.autoRenewalEnabled}</p>
              <p className="text-xs text-muted-foreground">自动续期</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 高级工具栏 */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">筛选:</span>
            <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'expired' | 'expiring') => setFilterStatus(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="expiring">将过期</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">排序:</span>
            <Select value={sortBy} onValueChange={(value: 'created' | 'expires' | 'emails' | 'renewals') => setSortBy(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">创建时间</SelectItem>
                <SelectItem value="expires">过期时间</SelectItem>
                <SelectItem value="emails">邮件数</SelectItem>
                <SelectItem value="renewals">续期次数</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">视图:</span>
            <Select value={viewMode} onValueChange={(value: 'table' | 'cards') => setViewMode(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">表格</SelectItem>
                <SelectItem value="cards">卡片</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedAddresses.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={batchRenewMailboxes}
            >
              批量续期 ({selectedAddresses.size})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportMailboxes}
          >
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
          
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
                自定义邮箱
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>创建自定义邮箱</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">基本设置</TabsTrigger>
                    <TabsTrigger value="advanced">高级选项</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>使用场景</Label>
                        <Select value={customSettings.scenario} onValueChange={(value) => setCustomSettings({...customSettings, scenario: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {scenarios.map((scenario) => (
                              <SelectItem key={scenario.id} value={scenario.id}>
                                {scenario.icon} {scenario.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>有效期（分钟）</Label>
                        <Input
                          type="number"
                          value={customSettings.expirationMinutes}
                          onChange={(e) => setCustomSettings({...customSettings, expirationMinutes: Number(e.target.value)})}
                          min={5}
                          max={1440}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>标签</Label>
                      <Input
                        placeholder="为邮箱添加标签..."
                        value={customSettings.label}
                        onChange={(e) => setCustomSettings({...customSettings, label: e.target.value})}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>最大续期次数</Label>
                        <Input
                          type="number"
                          value={customSettings.maxRenewals}
                          onChange={(e) => setCustomSettings({...customSettings, maxRenewals: Number(e.target.value)})}
                          min={0}
                          max={10}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-renewal"
                          checked={customSettings.autoRenewalEnabled}
                          onCheckedChange={(checked) => setCustomSettings({...customSettings, autoRenewalEnabled: checked})}
                        />
                        <Label htmlFor="auto-renewal">自动续期</Label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="custom-domain"
                          checked={customSettings.customDomain}
                          onCheckedChange={(checked) => setCustomSettings({...customSettings, customDomain: checked})}
                        />
                        <Label htmlFor="custom-domain">自定义域名</Label>
                      </div>
                      
                      {customSettings.customDomain && (
                        <div>
                          <Label>域名</Label>
                          <Input
                            placeholder="example.com"
                            value={customSettings.domain}
                            onChange={(e) => setCustomSettings({...customSettings, domain: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateCustomMailbox} disabled={isCreating}>
                    {isCreating ? "创建中..." : "创建邮箱"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 数据显示区域 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            显示 {filteredAndSortedAddresses.length} 个邮箱
            {selectedAddresses.size > 0 && ` (已选择 ${selectedAddresses.size} 个)`}
          </p>
        </div>
        
        {viewMode === 'table' ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAddresses.size === filteredAndSortedAddresses.length && filteredAndSortedAddresses.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>邮箱地址</TableHead>
                  <TableHead>标签</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>剩余时间</TableHead>
                  <TableHead>邮件数</TableHead>
                  <TableHead>续期</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAddresses.map((address) => (
                  <TableRow 
                    key={address.id}
                    className={`cursor-pointer ${address.id === currentAddressId ? 'bg-primary/5' : ''}`}
                    onClick={() => onAddressSelect(address)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedAddresses.has(address.id)}
                        onCheckedChange={() => toggleAddressSelection(address.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{address.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {address.label && (
                        <Badge variant="outline" className="text-xs">
                          {address.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(address)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatTimeRemaining(address.expiresAt)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{address._count?.emails || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{address.renewalCount}/{address.maxRenewals}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{new Date(address.createdAt).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAddress(address.address);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {address.isActive && address.renewalCount < address.maxRenewals && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              renewMailbox(address.id);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Checkbox
                        checked={selectedAddresses.has(address.id)}
                        onCheckedChange={() => toggleAddressSelection(address.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {getStatusBadge(address)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium truncate">
                        {address.address}
                      </span>
                    </div>
                    
                    {address.label && (
                      <Badge variant="outline" className="text-xs">
                        {address.label}
                      </Badge>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">剩余:</span>
                        <span className="ml-1">{formatTimeRemaining(address.expiresAt)}</span>
                      </div>
                      <div>
                        <span className="font-medium">邮件:</span>
                        <span className="ml-1">{address._count?.emails || 0}</span>
                      </div>
                      <div>
                        <span className="font-medium">续期:</span>
                        <span className="ml-1">{address.renewalCount}/{address.maxRenewals}</span>
                      </div>
                      <div>
                        <span className="font-medium">创建:</span>
                        <span className="ml-1">{new Date(address.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyAddress(address.address);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {address.isActive && address.renewalCount < address.maxRenewals && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            renewMailbox(address.id);
                          }}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {filteredAndSortedAddresses.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {filterStatus === 'all' ? '暂无邮箱' : `暂无${filterStatus}邮箱`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {filterStatus === 'all' 
                  ? '点击"自定义邮箱"创建您的第一个邮箱' 
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