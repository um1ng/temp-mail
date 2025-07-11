"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Forward, 
  Share2, 
  Download, 
  Link, 
  QrCode, 
  Mail, 
  FileText, 
  Eye,
  Copy,
  CheckCircle,
  AlertCircle
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
}

interface EmailForwardShareProps {
  email: Email;
  onForward?: (email: Email, targetEmail: string, message?: string) => void;
  onShare?: (email: Email, shareType: 'link' | 'qr' | 'export') => void;
  onExport?: (email: Email, format: 'pdf' | 'html' | 'eml' | 'txt') => void;
}

export function EmailForwardShare({ 
  email, 
  onForward, 
  onShare, 
  onExport 
}: EmailForwardShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [forwardEmail, setForwardEmail] = useState("");
  const [forwardMessage, setForwardMessage] = useState("");
  const [includeOriginal, setIncludeOriginal] = useState(true);
  const [shareLink, setShareLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 转发邮件
  const handleForward = async () => {
    if (!forwardEmail) {
      toast.error("请输入转发邮箱地址");
      return;
    }

    if (!forwardEmail.includes('@')) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    setIsForwarding(true);
    try {
      const response = await fetch(`/api/emails/${email.id}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: forwardEmail,
          message: forwardMessage,
          includeOriginal,
        }),
      });

      if (!response.ok) {
        throw new Error('转发失败');
      }

      toast.success("邮件已成功转发");
      onForward?.(email, forwardEmail, forwardMessage);
      setForwardEmail("");
      setForwardMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error('Error forwarding email:', error);
      toast.error("转发失败，请稍后重试");
    } finally {
      setIsForwarding(false);
    }
  };

  // 生成分享链接
  const handleGenerateShareLink = async () => {
    setIsGeneratingLink(true);
    try {
      const response = await fetch(`/api/emails/${email.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expirationHours: 24,
          accessType: 'view',
        }),
      });

      if (!response.ok) {
        throw new Error('生成分享链接失败');
      }

      const data = await response.json();
      setShareLink(data.shareUrl);
      onShare?.(email, 'link');
      toast.success("分享链接已生成");
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error("生成分享链接失败");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // 复制分享链接
  const handleCopyShareLink = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("分享链接已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  // 导出邮件
  const handleExport = async (format: 'pdf' | 'html' | 'eml' | 'txt') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/emails/${email.id}/export?format=${format}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email_${email.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onExport?.(email, format);
      toast.success(`邮件已导出为 ${format.toUpperCase()} 格式`);
    } catch (error) {
      console.error('Error exporting email:', error);
      toast.error("导出失败，请稍后重试");
    } finally {
      setIsExporting(false);
    }
  };

  // 生成二维码
  const handleGenerateQRCode = async () => {
    if (!shareLink) {
      await handleGenerateShareLink();
    }
    
    if (shareLink) {
      onShare?.(email, 'qr');
      toast.success("二维码已生成");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-1" />
          分享转发
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            邮件分享与转发
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="forward" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forward">转发</TabsTrigger>
            <TabsTrigger value="share">分享</TabsTrigger>
            <TabsTrigger value="export">导出</TabsTrigger>
          </TabsList>
          
          {/* 转发选项卡 */}
          <TabsContent value="forward" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Forward className="w-4 h-4" />
                  转发到邮箱
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="forward-email">目标邮箱地址</Label>
                  <Input
                    id="forward-email"
                    type="email"
                    placeholder="example@domain.com"
                    value={forwardEmail}
                    onChange={(e) => setForwardEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="forward-message">转发留言（可选）</Label>
                  <Textarea
                    id="forward-message"
                    placeholder="添加转发留言..."
                    value={forwardMessage}
                    onChange={(e) => setForwardMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-original"
                    checked={includeOriginal}
                    onCheckedChange={(checked) => setIncludeOriginal(checked === true)}
                  />
                  <Label htmlFor="include-original">包含原始邮件内容</Label>
                </div>
                
                <Button 
                  onClick={handleForward} 
                  disabled={isForwarding || !forwardEmail}
                  className="w-full"
                >
                  {isForwarding ? "转发中..." : "转发邮件"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 分享选项卡 */}
          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  生成分享链接
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">查看链接</div>
                      <div className="text-sm text-muted-foreground">
                        允许他人查看此邮件（24小时有效）
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateShareLink}
                    disabled={isGeneratingLink}
                    variant="outline"
                    size="sm"
                  >
                    {isGeneratingLink ? "生成中..." : "生成链接"}
                  </Button>
                </div>
                
                {shareLink && (
                  <div className="space-y-2">
                    <Label>分享链接</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={shareLink}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopyShareLink}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      链接已生成，24小时后自动失效
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateQRCode}
                    variant="outline"
                    className="flex-1"
                    disabled={!shareLink}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    生成二维码
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 导出选项卡 */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  导出邮件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    PDF 格式
                  </Button>
                  
                  <Button
                    onClick={() => handleExport('html')}
                    disabled={isExporting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    HTML 格式
                  </Button>
                  
                  <Button
                    onClick={() => handleExport('eml')}
                    disabled={isExporting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    EML 格式
                  </Button>
                  
                  <Button
                    onClick={() => handleExport('txt')}
                    disabled={isExporting}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    TXT 格式
                  </Button>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <div className="font-medium mb-1">导出格式说明：</div>
                      <ul className="space-y-1">
                        <li>• PDF: 适合打印和阅读</li>
                        <li>• HTML: 保留原始格式</li>
                        <li>• EML: 邮件客户端格式</li>
                        <li>• TXT: 纯文本格式</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}