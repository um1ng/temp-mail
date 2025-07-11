import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

interface SearchOptimizationHook<T> {
  searchQuery: string;
  searchResults: T[];
  isSearching: boolean;
  searchHistory: string[];
  handleSearch: (query: string) => void;
  clearSearch: () => void;
  clearHistory: () => void;
}

interface SearchOptions {
  debounceMs?: number;
  cacheSize?: number;
  enableHistory?: boolean;
}

export function useSearchOptimization<T>(
  searchFunction: (query: string) => Promise<T[]>,
  options: SearchOptions = {}
): SearchOptimizationHook<T> {
  const { 
    debounceMs = 300, 
    cacheSize = 50, 
    enableHistory = true 
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined' && enableHistory) {
      return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    }
    return [];
  });

  // 搜索结果缓存
  const searchCache = useMemo(() => new Map<string, T[]>(), []);

  // 防抖搜索函数
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // 检查缓存
      if (searchCache.has(query)) {
        setSearchResults(searchCache.get(query) || []);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchFunction(query);
        
        // 缓存结果
        if (searchCache.size >= cacheSize) {
          const firstKey = searchCache.keys().next().value;
          if (firstKey) {
            searchCache.delete(firstKey);
          }
        }
        searchCache.set(query, results);
        
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs),
    [searchFunction, searchCache, cacheSize, debounceMs]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    // 添加到搜索历史
    if (enableHistory && query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 9)]; // 保留最近10条
      setSearchHistory(newHistory);
      if (typeof window !== 'undefined') {
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
    }
    
    debouncedSearch(query);
  }, [debouncedSearch, searchHistory, enableHistory]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('searchHistory');
    }
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchHistory,
    handleSearch,
    clearSearch,
    clearHistory
  };
}

// 搜索性能监控
export function useSearchPerformance() {
  const [metrics, setMetrics] = useState({
    averageSearchTime: 0,
    totalSearches: 0,
    cacheHitRate: 0,
    slowSearches: 0
  });

  const trackSearch = useCallback((duration: number, fromCache: boolean) => {
    setMetrics(prev => {
      const newTotal = prev.totalSearches + 1;
      const newAverage = (prev.averageSearchTime * prev.totalSearches + duration) / newTotal;
      const cacheHits = fromCache ? 1 : 0;
      const newCacheHitRate = ((prev.cacheHitRate * prev.totalSearches) + cacheHits) / newTotal;
      const slowSearches = duration > 1000 ? prev.slowSearches + 1 : prev.slowSearches;

      return {
        averageSearchTime: newAverage,
        totalSearches: newTotal,
        cacheHitRate: newCacheHitRate,
        slowSearches
      };
    });
  }, []);

  return { metrics, trackSearch };
}

// 智能搜索建议
export function useSearchSuggestions(searchQuery: string, searchHistory: string[]) {
  return useMemo(() => {
    if (!searchQuery.trim()) return [];

    const suggestions = new Set<string>();
    
    // 从历史记录中匹配
    searchHistory.forEach(history => {
      if (history.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.add(history);
      }
    });

    // 添加常用搜索建议
    const commonSuggestions = [
      '验证码',
      '密码重置',
      '账单',
      '通知',
      '重要',
      '紧急',
      '订单',
      '确认'
    ];

    commonSuggestions.forEach(suggestion => {
      if (suggestion.includes(searchQuery) || searchQuery.includes(suggestion)) {
        suggestions.add(suggestion);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, searchHistory]);
}