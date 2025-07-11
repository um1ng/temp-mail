"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Settings, 
  Users,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { SimpleMailboxView } from "./mailbox-views/simple-view";
import { StandardMailboxView } from "./mailbox-views/standard-view";
import { ExpertMailboxView } from "./mailbox-views/expert-view";

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

// 使用场景模板
export interface ScenarioTemplate {
  id: string;
  name: string;
  icon: string;
  duration: number; // 分钟
  description: string;
  autoFeatures: string[];
  color: string;
  popular?: boolean;
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: "website-register",
    name: "网站注册",
    icon: "🌐",
    duration: 60,
    description: "注册新网站账号，1小时有效",
    autoFeatures: ["自动提取验证码", "注册完成提醒"],
    color: "bg-blue-500",
    popular: true
  },
  {
    id: "verification-code",
    name: "验证码接收",
    icon: "🔐",
    duration: 15,
    description: "快速接收验证码，15分钟有效",
    autoFeatures: ["验证码高亮", "自动复制"],
    color: "bg-green-500",
    popular: true
  },
  {
    id: "file-receive",
    name: "文件接收",
    icon: "📎",
    duration: 180,
    description: "接收文件和附件，3小时有效",
    autoFeatures: ["附件预览", "自动下载"],
    color: "bg-purple-500"
  },
  {
    id: "newsletter",
    name: "订阅测试",
    icon: "📰",
    duration: 720,
    description: "测试邮件订阅，12小时有效",
    autoFeatures: ["邮件分类", "订阅管理"],
    color: "bg-orange-500"
  },
  {
    id: "app-testing",
    name: "应用测试",
    icon: "🧪",
    duration: 1440,
    description: "应用开发测试，24小时有效",
    autoFeatures: ["开发者模式", "API日志"],
    color: "bg-pink-500"
  },
  {
    id: "custom",
    name: "自定义",
    icon: "⚙️",
    duration: 60,
    description: "自定义配置",
    autoFeatures: ["完全控制"],
    color: "bg-gray-500"
  }
];

export type ViewMode = "simple" | "standard" | "expert";

interface MailboxManagerProps {
  currentAddressId: string;
  onAddressSelect: (address: EmailAddress) => void;
  onAddressUpdate: (address: EmailAddress) => void;
}

export function MailboxManager({ currentAddressId, onAddressSelect, onAddressUpdate }: MailboxManagerProps) {
  const [addresses, setAddresses] = useState<EmailAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("standard");
  
  // 获取保存的用户偏好
  useEffect(() => {
    const savedMode = localStorage.getItem('mailbox-view-mode') as ViewMode;
    if (savedMode && ['simple', 'standard', 'expert'].includes(savedMode)) {
      setViewMode(savedMode);
    }
  }, []);

  // 保存用户偏好
  const handleViewModeChange = (mode: string) => {
    const validMode = mode as ViewMode;
    setViewMode(validMode);
    localStorage.setItem('mailbox-view-mode', validMode);
  };

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

  // 创建场景化邮箱
  const createScenarioMailbox = async (template: ScenarioTemplate, customLabel?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expirationMinutes: template.duration,
          label: customLabel || template.name,
          scenario: template.id,
          autoFeatures: template.autoFeatures
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
      
      toast.success(`${template.name}邮箱已创建`);
    } catch (error) {
      console.error('Error creating mailbox:', error);
      toast.error("创建邮箱失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const commonProps = {
    addresses,
    currentAddressId,
    isLoading,
    onAddressSelect,
    onAddressUpdate,
    onRefresh: fetchAddresses,
    onCreateScenario: createScenarioMailbox,
    scenarios: SCENARIO_TEMPLATES
  };

  return (
    <div className="space-y-6">
      {/* 头部 - 视图模式切换 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">邮箱管理器</h2>
            <p className="text-sm text-muted-foreground">管理您的临时邮箱</p>
          </div>
        </div>

        {/* 视图模式切换 */}
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={handleViewModeChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simple" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                简化
              </TabsTrigger>
              <TabsTrigger value="standard" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                标准
              </TabsTrigger>
              <TabsTrigger value="expert" className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                专家
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 视图内容 */}
      <div className="min-h-[400px]">
        {viewMode === "simple" && <SimpleMailboxView {...commonProps} />}
        {viewMode === "standard" && <StandardMailboxView {...commonProps} />}
        {viewMode === "expert" && <ExpertMailboxView {...commonProps} />}
      </div>
    </div>
  );
}