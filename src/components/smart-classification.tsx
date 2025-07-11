"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Tag, 
  Sparkles, 
  Filter, 
  Plus, 
  X, 
  Hash, 
  Mail, 
  Shield, 
  ShoppingBag,
  Bell,
  Key
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  category?: string;
  tags?: string[];
  verificationCode?: string;
}

interface EmailLabel {
  id: string;
  name: string;
  color: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SmartClassificationProps {
  emails: Email[];
  onEmailUpdate: (emailId: string, updates: Partial<Email>) => void;
  onBulkClassify?: () => void;
}

const DEFAULT_CATEGORIES = [
  {
    id: 'verification',
    name: '验证码',
    icon: Key,
    color: 'bg-blue-500',
    patterns: [/验证码|verification|code|otp/i, /\d{4,8}/],
    keywords: ['验证码', '动态密码', '验证', 'verification', 'code', 'OTP']
  },
  {
    id: 'notification',
    name: '通知',
    icon: Bell,
    color: 'bg-green-500',
    patterns: [/通知|notification|alert|提醒/i],
    keywords: ['通知', '提醒', '消息', 'notification', 'alert', 'reminder']
  },
  {
    id: 'marketing',
    name: '营销',
    icon: ShoppingBag,
    color: 'bg-orange-500',
    patterns: [/营销|promotion|offer|优惠|折扣/i],
    keywords: ['营销', '推广', '优惠', '折扣', 'promotion', 'offer', 'discount']
  },
  {
    id: 'security',
    name: '安全',
    icon: Shield,
    color: 'bg-red-500',
    patterns: [/安全|security|登录|login|密码|password/i],
    keywords: ['安全', '登录', '密码', '账户', 'security', 'login', 'password']
  },
  {
    id: 'other',
    name: '其他',
    icon: Mail,
    color: 'bg-gray-500',
    patterns: [],
    keywords: []
  }
];

export function SmartClassification({ emails, onEmailUpdate, onBulkClassify }: SmartClassificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customLabels, setCustomLabels] = useState<EmailLabel[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [autoClassifyEnabled, setAutoClassifyEnabled] = useState(true);
  const [extractVerificationCodes, setExtractVerificationCodes] = useState(true);

  // 智能分类邮件
  const classifyEmail = (email: Email): string => {
    const content = `${email.subject} ${email.content}`.toLowerCase();
    
    for (const category of DEFAULT_CATEGORIES) {
      if (category.id === 'other') continue;
      
      // 检查正则模式
      const matchesPattern = category.patterns.some(pattern => pattern.test(content));
      
      // 检查关键词
      const matchesKeywords = category.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      
      if (matchesPattern || matchesKeywords) {
        return category.id;
      }
    }
    
    return 'other';
  };

  // 提取验证码
  const extractVerificationCode = (email: Email): string | undefined => {
    const content = `${email.subject} ${email.content}`;
    
    // 常见验证码模式
    const patterns = [
      /(?:验证码|动态密码|code|验证|OTP)[\s:：]*(\d{4,8})/i,
      /\b(\d{6})\b/g, // 6位数字
      /\b(\d{4})\b/g, // 4位数字
      /验证码\s*(\d+)/i,
      /code[\s:：]*(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return undefined;
  };

  // 批量分类所有邮件
  const handleBulkClassify = async () => {
    try {
      for (const email of emails) {
        const category = classifyEmail(email);
        const verificationCode = extractVerificationCodes ? extractVerificationCode(email) : undefined;
        
        if (email.category !== category || (verificationCode && !email.verificationCode)) {
          onEmailUpdate(email.id, {
            category,
            verificationCode
          });
        }
      }
      
      toast.success(`已自动分类 ${emails.length} 封邮件`);
      onBulkClassify?.();
    } catch {
      toast.error("自动分类失败");
    }
  };

  // 添加自定义标签
  const handleAddCustomLabel = () => {
    if (!newLabelName.trim()) return;
    
    const newLabel: EmailLabel = {
      id: `custom_${Date.now()}`,
      name: newLabelName.trim(),
      color: newLabelColor,
      count: 0
    };
    
    setCustomLabels(prev => [...prev, newLabel]);
    setNewLabelName("");
    toast.success("标签已添加");
  };

  // 删除自定义标签
  const handleDeleteCustomLabel = (labelId: string) => {
    setCustomLabels(prev => prev.filter(label => label.id !== labelId));
    toast.success("标签已删除");
  };

  // 应用标签到选中邮件
  const handleApplyLabel = (labelName: string) => {
    if (selectedEmails.length === 0) {
      toast.error("请先选择邮件");
      return;
    }
    
    selectedEmails.forEach(emailId => {
      const email = emails.find(e => e.id === emailId);
      if (email) {
        const updatedTags = [...(email.tags || [])];
        if (!updatedTags.includes(labelName)) {
          updatedTags.push(labelName);
          onEmailUpdate(emailId, { tags: updatedTags });
        }
      }
    });
    
    setSelectedEmails([]);
    toast.success(`已为 ${selectedEmails.length} 封邮件添加标签: ${labelName}`);
  };

  // 计算分类统计
  const categoryStats = DEFAULT_CATEGORIES.map(category => ({
    ...category,
    count: emails.filter(email => email.category === category.id).length
  }));

  // 获取验证码邮件
  const verificationEmails = emails.filter(email => 
    email.verificationCode && email.category === 'verification'
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-1" />
          智能分类
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            智能分类与标签管理
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 自动分类设置 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                自动分类
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">启用自动分类</div>
                  <div className="text-sm text-muted-foreground">
                    新邮件将自动分类到相应类别
                  </div>
                </div>
                <Checkbox
                  checked={autoClassifyEnabled}
                  onCheckedChange={(checked) => setAutoClassifyEnabled(checked === true)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">提取验证码</div>
                  <div className="text-sm text-muted-foreground">
                    自动识别和提取邮件中的验证码
                  </div>
                </div>
                <Checkbox
                  checked={extractVerificationCodes}
                  onCheckedChange={(checked) => setExtractVerificationCodes(checked === true)}
                />
              </div>
              
              <Button onClick={handleBulkClassify} className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                立即分类所有邮件
              </Button>
            </CardContent>
          </Card>

          {/* 分类统计 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">分类统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {categoryStats.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      <category.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary">{category.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 验证码快速访问 */}
          {verificationEmails.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  最近验证码
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {verificationEmails.slice(0, 5).map((email) => (
                    <div
                      key={email.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {email.from}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {email.timestamp.toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                          {email.verificationCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(email.verificationCode || '');
                            toast.success("验证码已复制");
                          }}
                        >
                          复制
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 自定义标签 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="w-4 h-4" />
                自定义标签
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="标签名称"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-12 h-9 rounded border"
                />
                <Button onClick={handleAddCustomLabel} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {customLabels.length > 0 && (
                <div className="space-y-2">
                  <Label>已创建的标签</Label>
                  <div className="flex flex-wrap gap-2">
                    {customLabels.map((label) => (
                      <div
                        key={label.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        <span>{label.name}</span>
                        <button
                          onClick={() => handleDeleteCustomLabel(label.id)}
                          className="hover:bg-black/10 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>快速应用标签</Label>
                <div className="text-sm text-muted-foreground">
                  选择邮件后点击标签即可应用
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...DEFAULT_CATEGORIES.slice(0, -1), ...customLabels].map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyLabel(item.name)}
                      disabled={selectedEmails.length === 0}
                    >
                      {item.icon && <item.icon className="w-3 h-3 mr-1" />}
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}