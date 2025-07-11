"use client";

import { useState, useRef, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  refreshingText = "正在刷新...",
  pullText = "下拉刷新",
  releaseText = "释放刷新",
  disabled = false
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  // 重置状态
  const resetPull = () => {
    setPullDistance(0);
    setCanRefresh(false);
    setIsDragging(false);
  };

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    startY.current = e.touches[0].clientY;
    scrollTop.current = container.scrollTop;
    setIsDragging(true);
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // 只有当容器在顶部且向下拖动时才触发下拉刷新
    if (scrollTop.current === 0 && deltaY > 0) {
      e.preventDefault();
      
      // 计算下拉距离，添加阻尼效果
      const maxPull = threshold * 2;
      const resistance = 0.5;
      const distance = Math.min(deltaY * resistance, maxPull);
      
      setPullDistance(distance);
      setCanRefresh(distance >= threshold);
      
      // 触觉反馈
      if (distance >= threshold && !canRefresh) {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }
  };

  // 触摸结束
  const handleTouchEnd = async () => {
    if (!isDragging || disabled || isRefreshing) return;
    
    setIsDragging(false);
    
    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setTimeout(resetPull, 300);
      }
    } else {
      resetPull();
    }
  };

  // 动画效果
  const refreshIndicatorStyle = {
    transform: `translateY(${Math.min(pullDistance - threshold, 0)}px) scale(${
      Math.min(pullDistance / threshold, 1)
    })`,
    opacity: Math.min(pullDistance / threshold, 1)
  };

  const contentStyle = {
    transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
  };

  // 获取显示文本
  const getDisplayText = () => {
    if (isRefreshing) return refreshingText;
    if (canRefresh) return releaseText;
    return pullText;
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto h-full pull-to-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      <div 
        className="pull-to-refresh-indicator"
        style={refreshIndicatorStyle}
      >
        <div className="flex flex-col items-center text-muted-foreground">
          <RefreshCw 
            className={cn(
              "w-6 h-6 mb-2",
              (isRefreshing || canRefresh) && "animate-spin"
            )} 
          />
          <span className="text-sm font-medium">{getDisplayText()}</span>
        </div>
      </div>

      {/* 主要内容 */}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}