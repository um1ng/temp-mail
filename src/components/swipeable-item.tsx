"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SwipeableItemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: ReactNode;
    label: string;
    className?: string;
  };
  rightAction?: {
    icon: ReactNode;
    label: string;
    className?: string;
  };
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  disabled = false,
  threshold = 80,
  className
}: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isActionTriggered, setIsActionTriggered] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // 重置位置
  const resetPosition = () => {
    setTranslateX(0);
    setIsDragging(false);
    setIsActionTriggered(false);
  };

  // 平滑动画到目标位置
  const animateToPosition = (targetX: number, callback?: () => void) => {
    const startTranslateX = translateX;
    const distance = targetX - startTranslateX;
    const duration = 200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const newX = startTranslateX + distance * easeProgress;
      
      setTranslateX(newX);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        callback?.();
      }
    };

    if (animationRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  };

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
    setIsActionTriggered(false);
    
    if (animationRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const touch = e.touches[0];
    
    const deltaX = touch.clientX - startX;
    const newTranslateX = Math.max(-150, Math.min(150, deltaX));
    
    setTranslateX(newTranslateX);
    
    // 检查是否触发动作阈值
    const leftTriggered = newTranslateX > threshold && leftAction && !!onSwipeRight;
    const rightTriggered = newTranslateX < -threshold && rightAction && !!onSwipeLeft;
    
    setIsActionTriggered(!!(leftTriggered || rightTriggered));
  };

  // 触摸结束
  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    
    const absTranslateX = Math.abs(translateX);
    
    // 检查是否达到触发阈值
    if (absTranslateX > threshold) {
      if (translateX > 0 && leftAction && onSwipeRight) {
        // 右滑动作
        animateToPosition(0, () => {
          onSwipeRight();
          resetPosition();
        });
        return;
      } else if (translateX < 0 && rightAction && onSwipeLeft) {
        // 左滑动作
        animateToPosition(0, () => {
          onSwipeLeft();
          resetPosition();
        });
        return;
      }
    }
    
    // 没有达到阈值，回弹到原位
    animateToPosition(0, () => {
      resetPosition();
    });
  };

  // 鼠标事件处理（桌面端）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    setStartX(e.clientX);
    setIsDragging(true);
    setIsActionTriggered(false);
    
    if (animationRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  // Desktop mouse events are handled via global listeners in useEffect

  // 全局鼠标事件监听
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      
      const deltaX = e.clientX - startX;
      const newTranslateX = Math.max(-150, Math.min(150, deltaX));
      
      setTranslateX(newTranslateX);
      
      const leftTriggered = newTranslateX > threshold && leftAction && !!onSwipeRight;
      const rightTriggered = newTranslateX < -threshold && rightAction && !!onSwipeLeft;
      
      setIsActionTriggered(!!(leftTriggered || rightTriggered));
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging || disabled) return;
      
      const absTranslateX = Math.abs(translateX);
      
      if (absTranslateX > threshold) {
        if (translateX > 0 && leftAction && onSwipeRight) {
          animateToPosition(0, () => {
            onSwipeRight();
            resetPosition();
          });
          return;
        } else if (translateX < 0 && rightAction && onSwipeLeft) {
          animateToPosition(0, () => {
            onSwipeLeft();
            resetPosition();
          });
          return;
        }
      }
      
      animateToPosition(0, resetPosition);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, translateX, threshold, disabled, leftAction, rightAction, onSwipeLeft, onSwipeRight]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ touchAction: disabled ? 'auto' : 'pan-y' }}
    >
      {/* 左侧动作背景 */}
      {leftAction && (
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 flex items-center justify-start pl-4 transition-opacity",
            leftAction.className,
            translateX > threshold && isActionTriggered ? "opacity-100" : "opacity-60"
          )}
          style={{
            width: Math.max(0, translateX),
            transform: `translateX(${Math.min(0, translateX - 150)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-white">
            {leftAction.icon}
            <span className="text-sm font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* 右侧动作背景 */}
      {rightAction && (
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 transition-opacity",
            rightAction.className,
            translateX < -threshold && isActionTriggered ? "opacity-100" : "opacity-60"
          )}
          style={{
            width: Math.max(0, -translateX),
            transform: `translateX(${Math.max(0, -translateX - 150)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div
        className={cn(
          "relative bg-background transition-all duration-75",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          isActionTriggered && "scale-95"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
}