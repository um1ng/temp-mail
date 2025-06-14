"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Mail, RefreshCw, Trash2 } from "lucide-react";

interface Email {
  id: string;
  from: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export default function Home() {
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 生成随机邮箱地址
  const generateEmail = () => {
    const randomString = Math.random().toString(36).substring(2, 10);
    const domains = ["tempmail.com", "10minutemail.com", "guerrillamail.com"];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const email = `${randomString}@${domain}`;
    setCurrentEmail(email);
    setEmails([]);
    toast.success("新邮箱地址已生成");
  };

  // 复制邮箱地址
  const copyEmail = async () => {
    if (currentEmail) {
      await navigator.clipboard.writeText(currentEmail);
      toast.success("邮箱地址已复制到剪贴板");
    }
  };

  // 刷新邮件
  const refreshEmails = () => {
    if (!currentEmail) return;
    
    setIsLoading(true);
    // 模拟获取邮件
    setTimeout(() => {
      const mockEmails: Email[] = [
        {
          id: "1",
          from: "service@example.com",
          subject: "欢迎使用临时邮箱服务",
          content: "感谢您使用我们的临时邮箱服务。这是一封测试邮件。",
          timestamp: new Date(),
          isRead: false
        },
        {
          id: "2",
          from: "noreply@github.com",
          subject: "验证您的邮箱地址",
          content: "请点击以下链接验证您的邮箱地址...",
          timestamp: new Date(Date.now() - 300000),
          isRead: false
        }
      ];
      setEmails(mockEmails);
      setIsLoading(false);
      toast.success("邮件已刷新");
    }, 1000);
  };

  // 删除邮件
  const deleteEmail = (emailId: string) => {
    setEmails(emails.filter(email => email.id !== emailId));
    toast.success("邮件已删除");
  };

  // 标记邮件为已读
  const markAsRead = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
  };

  // 初始化时生成邮箱
  useEffect(() => {
    generateEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            临时邮箱服务
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            快速生成临时邮箱地址，保护您的隐私
          </p>
        </div>

        {/* 邮箱生成区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              当前邮箱地址
            </CardTitle>
            <CardDescription>
              您的临时邮箱地址，可用于接收邮件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={currentEmail} 
                readOnly 
                className="font-mono"
                placeholder="点击生成新邮箱"
              />
              <Button onClick={copyEmail} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={generateEmail} variant="outline">
                生成新邮箱
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 邮件列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>收件箱</CardTitle>
                <CardDescription>
                  {emails.length} 封邮件
                </CardDescription>
              </div>
              <Button 
                onClick={refreshEmails} 
                variant="outline" 
                size="sm"
                disabled={isLoading || !currentEmail}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {emails.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                暂无邮件，请等待新邮件到达
              </div>
            ) : (
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list">列表视图</TabsTrigger>
                  <TabsTrigger value="detail">详细视图</TabsTrigger>
                </TabsList>
                
                <TabsContent value="list" className="space-y-2">
                  {emails.map((email) => (
                    <div 
                      key={email.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        !email.isRead ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' : ''
                      }`}
                      onClick={() => markAsRead(email.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{email.from}</span>
                            {!email.isRead && <Badge variant="secondary" className="text-xs">新</Badge>}
                          </div>
                          <h3 className="font-semibold">{email.subject}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {email.content}
                          </p>
                          <p className="text-xs text-slate-500">
                            {email.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEmail(email.id);
                          }}
                          variant="ghost" 
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="detail" className="space-y-4">
                  {emails.map((email) => (
                    <Card key={email.id} className={!email.isRead ? 'border-blue-200 dark:border-blue-800' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{email.subject}</CardTitle>
                            <CardDescription>
                              来自: {email.from} • {email.timestamp.toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {!email.isRead && <Badge variant="secondary">新</Badge>}
                            <Button 
                              onClick={() => deleteEmail(email.id)}
                              variant="ghost" 
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Separator className="mb-4" />
                        <div className="whitespace-pre-wrap text-sm">
                          {email.content}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="text-center text-sm text-slate-500">
          <p>临时邮箱地址会在一定时间后自动失效，请及时查收邮件</p>
        </div>
      </div>
    </div>
  );
}
