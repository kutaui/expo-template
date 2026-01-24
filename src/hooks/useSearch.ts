import { useMemo, useState } from 'react';

export interface SearchOptions<T> {
  items: T[];
  searchKey?: keyof T | ((item: T) => string);
  filterFn?: (item: T, query: string) => boolean;
  enabled?: boolean;
  debounceMs?: number;
}

export interface SearchState<T> {
  filteredItems: T[];
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  hasResults: boolean;
  hasQuery: boolean;
  isEmpty: boolean;
}

/**
 * Simple search/filter hook with optional debouncing
 *
 * Usage:
 *   const { filteredItems, query, setQuery } = useSearch({
 *     items: yourItems,
 *     searchKey: 'name',
 *   });
 */

export function useSearch<T = unknown>({
  items,
  searchKey,
  filterFn,
  enabled = true,
  debounceMs = 300,
}: SearchOptions<T>): SearchState<T> {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Simple debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const filteredItems = useMemo(() => {
    if (!enabled || !debouncedQuery) {
      return items;
    }

    const lowerQuery = debouncedQuery.toLowerCase();

    return items.filter((item) => {
      // Use custom filter function if provided
      if (filterFn) {
        return filterFn(item, lowerQuery);
      }

      // Default: search by key or stringify
      if (!searchKey) {
        return JSON.stringify(item).toLowerCase().includes(lowerQuery);
      }

      // Search by key
      const value = typeof searchKey === 'function'
        ? searchKey(item as T)
        : item[searchKey];

      if (value === undefined || value === null) {
        return false;
      }

      return String(value).toLowerCase().includes(lowerQuery);
    });
  }, [items, debouncedQuery, searchKey, filterFn, enabled]);

  return {
    filteredItems,
    query,
    setQuery,
    clearQuery: () => setQuery(''),
    hasResults: filteredItems.length > 0,
    hasQuery: debouncedQuery.length > 0,
    isEmpty: !debouncedQuery || filteredItems.length === 0,
  };
}

/**
 * Filter hook with multiple criteria
 *
 * Usage:
 *   const { filteredItems, addFilter, removeFilter, filters } = useFilter({
 *     items: yourItems,
 *   });
 */

export interface Filter<T> {
  key: string;
  value: unknown;
  label?: string;
  fn?: (item: T) => boolean;
}

export interface FilterState<T> {
  filteredItems: T[];
  filters: Filter<T>[];
  addFilter: (filter: Filter<T>) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function useFilter<T = unknown>(
  items: T[],
  options?: {
    enabled?: boolean;
  }
): FilterState<T> {
  const [filters, setFilters] = useState<Filter<T>[]>([]);

  const filteredItems = useMemo(() => {
    if (filters.length === 0) {
      return items;
    }

    return items.filter((item) => {
      return filters.every((filter) => {
        // Use custom function if provided
        if (filter.fn) {
          return filter.fn(item);
        }

        // Default: check equality
        if (filter.value === undefined || filter.value === null) {
          return false;
        }

        const itemValue = item[filter.key as keyof T];
        return itemValue === filter.value;
      });
    });
  }, [items, filters]);

  const addFilter = (filter: Filter<T>) => {
    setFilters((prev) => {
      const exists = prev.some((f) => f.key === filter.key);
      return exists ? prev : [...prev, filter];
    });
  };

  const removeFilter = (key: string) => {
    setFilters((prev) => prev.filter((f) => f.key !== key));
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return {
    filteredItems,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters: filters.length > 0,
  };
}

import { useEffect } from 'react';
