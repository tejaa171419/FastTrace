import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface SearchUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface UseUserSearchReturn {
  users: SearchUser[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Hook to search users for money transfer
 * @param minQueryLength - Minimum query length to trigger search (default: 2)
 */
export const useUserSearch = (minQueryLength: number = 2): UseUserSearchReturn => {
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    // Clear results if query is too short
    if (!query || query.length < minQueryLength) {
      setUsers([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/users/search/${encodeURIComponent(query)}`);

      if (response.success) {
        setUsers(response.data.users || []);
      } else {
        setError(response.message || 'Failed to search users');
        setUsers([]);
      }
    } catch (err: any) {
      console.error('User search error:', err);
      const errorMessage = err.message || err.data?.message || 'Failed to search users';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [minQueryLength]);

  const clearResults = useCallback(() => {
    setUsers([]);
    setError(null);
  }, []);

  return {
    users,
    loading,
    error,
    search,
    clearResults,
  };
};

export default useUserSearch;