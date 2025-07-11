"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioTemplate } from "../enhanced-mailbox-manager";
import { Plus, Mail, Copy, Clock, Sparkles } from "lucide-react";
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

interface SimpleMailboxViewProps {
  addresses: EmailAddress[];
  currentAddressId: string;
  isLoading: boolean;
  onAddressSelect: (address: EmailAddress) => void;
  onAddressUpdate: (address: EmailAddress) => void;
  onRefresh: () => void;
  onCreateScenario: (template: ScenarioTemplate, customLabel?: string) => Promise<void>;
  scenarios: ScenarioTemplate[];
}

export function SimpleMailboxView({ 
  addresses, 
  currentAddressId, 
  isLoading, 
  onAddressSelect, 
  onCreateScenario,
  scenarios 
}: SimpleMailboxViewProps) {
  const [isCreating, setIsCreating] = useState(false);

  // 只显示活跃的邮箱
  const activeAddresses = addresses.filter(addr => 
    addr.isActive && new Date(addr.expiresAt).getTime() > new Date().getTime()
  );

  // 获取热门场景模板
  const popularScenarios = scenarios.filter(s => s.popular);

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

  // 创建场景邮箱
  const handleCreateScenario = async (template: ScenarioTemplate) => {
    setIsCreating(true);
    try {
      await onCreateScenario(template);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 快速创建区域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-medium">快速创建邮箱</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularScenarios.map((scenario) => (
            <Card 
              key={scenario.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
              onClick={() => handleCreateScenario(scenario)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${scenario.color} flex items-center justify-center text-2xl`}>
                    {scenario.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{scenario.name}</h4>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {scenario.duration >= 60 
                          ? `${Math.floor(scenario.duration / 60)}小时` 
                          : `${scenario.duration}分钟`
                        }
                      </Badge>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 活跃邮箱列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium">我的邮箱</h3>
            <Badge variant="outline">{activeAddresses.length}</Badge>
          </div>
        </div>

        {activeAddresses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">还没有活跃的邮箱</h3>
              <p className="text-muted-foreground mb-4">选择上方的场景快速创建您的第一个邮箱</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeAddresses.map((address) => (
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
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-sm font-medium truncate">
                          {address.address}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAddress(address.address);
                          }}
                          className="ml-auto flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeRemaining(address.expiresAt)}</span>
                        </div>
                        
                        {address.label && (
                          <Badge variant="outline" className="text-xs">
                            {address.label}
                          </Badge>
                        )}

                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{address._count?.emails || 0} 封邮件</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {(isLoading || isCreating) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}