"use client"

import * as React from "react"
import { useState, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  User,
  Tag,
  Clock
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SearchFilters {
  dateRange?: {
    from: Date
    to: Date
  }
  sender?: string
  hasAttachments?: boolean
  isRead?: boolean
  isStarred?: boolean
}

interface EmailSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void
  onClear: () => void
  isSearching?: boolean
  className?: string
}

export function EmailSearch({ 
  onSearch, 
  onClear, 
  className 
}: EmailSearchProps) {
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // 搜索建议
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // 从localStorage加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('email-search-history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // 保存搜索历史
  const saveSearchHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('email-search-history', JSON.stringify(newHistory))
  }, [searchHistory])

  // 生成搜索建议
  const generateSuggestions = useCallback((input: string) => {
    if (!input.trim()) {
      setSuggestions(searchHistory.slice(0, 5))
      return
    }

    const matchingHistory = searchHistory.filter(h => 
      h.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 3)

    const commonSearches = [
      "验证码",
      "通知",
      "密码重置",
      "账单",
      "订单确认"
    ].filter(s => s.toLowerCase().includes(input.toLowerCase()))

    setSuggestions([...matchingHistory, ...commonSearches].slice(0, 5))
  }, [searchHistory])

  // 处理搜索输入
  const handleInputChange = (value: string) => {
    setQuery(value)
    generateSuggestions(value)
    setShowSuggestions(true)
  }

  // 执行搜索
  const handleSearch = useCallback(() => {
    if (query.trim() || Object.keys(filters).length > 0) {
      onSearch(query.trim(), filters)
      saveSearchHistory(query.trim())
      setShowSuggestions(false)
    }
  }, [query, filters, onSearch, saveSearchHistory])

  // 清除搜索
  const handleClear = () => {
    setQuery("")
    setFilters({})
    setShowSuggestions(false)
    onClear()
  }

  // 应用筛选器
  const updateFilter = (key: keyof SearchFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 移除筛选器
  const removeFilter = (key: keyof SearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }

  // 计算活跃筛选器数量
  const activeFiltersCount = Object.keys(filters).length

  return (
    <div className={cn("space-y-3", className)}>
      {/* 搜索栏 */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
          <Input
            placeholder="搜索邮件..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              } else if (e.key === 'Escape') {
                setShowSuggestions(false)
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {(query || activeFiltersCount > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 relative"
                >
                  <Filter className="h-3 w-3" />
                  {activeFiltersCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <FilterPanel 
                  filters={filters}
                  onUpdateFilter={updateFilter}
                  onRemoveFilter={removeFilter}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 搜索建议 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex items-center gap-2"
                onClick={() => {
                  setQuery(suggestion)
                  setShowSuggestions(false)
                  setTimeout(() => handleSearch(), 100)
                }}
              >
                <Clock className="h-3 w-3 text-muted-foreground" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 活跃筛选器标签 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              日期范围
              <button onClick={() => removeFilter('dateRange')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.sender && (
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              发件人: {filters.sender}
              <button onClick={() => removeFilter('sender')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.hasAttachments && (
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              有附件
              <button onClick={() => removeFilter('hasAttachments')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.isRead !== undefined && (
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {filters.isRead ? "已读" : "未读"}
              <button onClick={() => removeFilter('isRead')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.isStarred && (
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              已加星标
              <button onClick={() => removeFilter('isStarred')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// 筛选器面板组件
function FilterPanel({ 
  filters, 
  onUpdateFilter, 
  onRemoveFilter 
}: {
  filters: SearchFilters
  onUpdateFilter: (key: keyof SearchFilters, value: string | boolean | undefined) => void
  onRemoveFilter: (key: keyof SearchFilters) => void
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">高级筛选</h4>
      
      {/* 发件人筛选 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">发件人</label>
        <Input
          placeholder="输入发件人邮箱或域名"
          value={filters.sender || ""}
          onChange={(e) => onUpdateFilter('sender', e.target.value)}
        />
      </div>

      {/* 邮件状态 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">邮件状态</label>
        <Select
          value={
            filters.isRead === true ? "read" : 
            filters.isRead === false ? "unread" : ""
          }
          onValueChange={(value) => {
            if (value === "read") onUpdateFilter('isRead', true)
            else if (value === "unread") onUpdateFilter('isRead', false)
            else onRemoveFilter('isRead')
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="read">已读</SelectItem>
            <SelectItem value="unread">未读</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 其他选项 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">其他选项</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.hasAttachments || false}
              onChange={(e) => 
                e.target.checked 
                  ? onUpdateFilter('hasAttachments', true)
                  : onRemoveFilter('hasAttachments')
              }
            />
            <span className="text-sm">有附件</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.isStarred || false}
              onChange={(e) => 
                e.target.checked 
                  ? onUpdateFilter('isStarred', true)
                  : onRemoveFilter('isStarred')
              }
            />
            <span className="text-sm">已加星标</span>
          </label>
        </div>
      </div>
    </div>
  )
}