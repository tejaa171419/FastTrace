import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService, Expense, CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters } from '@/lib/services';

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters?: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
  analytics: () => [...expenseKeys.all, 'analytics'] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
};

// Get expenses with filters
export const useExpenses = (filters?: ExpenseFilters) => {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: async () => {
      // All debug logging permanently disabled for performance
      const result = await expenseService.getExpenses(filters);
    // All debug logging permanently disabled for performance
      return result;
    },
    select: (data) => {
    // All debug logging permanently disabled for performance
      const processed = {
        expenses: data?.expenses || [],
        pagination: data?.pagination,
      };
    // All debug logging permanently disabled for performance
      return processed;
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single expense
export const useExpense = (id: string) => {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseService.getExpense(id),
    select: (data) => data?.expense,
    enabled: !!id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get expense analytics
export const useExpenseAnalytics = (params?: {
  period?: 'week' | 'month' | 'quarter' | 'year';
  groupId?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: [...expenseKeys.analytics(), params],
    queryFn: () => expenseService.getAnalytics(params),
    select: (data) => data,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get expense categories
export const useExpenseCategories = () => {
  return useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: () => expenseService.getCategories(),
    select: (data) => data?.categories || [],
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
};

// Create expense mutation
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseData: CreateExpenseRequest) => expenseService.createExpense(expenseData),
    onSuccess: (data) => {
      // Invalidate expenses lists
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      
      // Also invalidate group-related queries if it's a group expense
      if (data?.expense.groupId) {
        const groupId = typeof data.expense.groupId === 'string' 
          ? data.expense.groupId 
          : data.expense.groupId._id;
          
        queryClient.invalidateQueries({ 
          queryKey: ['groups', 'detail', groupId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['balances'] 
        });
      }
      
      // Add expense to cache
      if (data?.expense) {
        queryClient.setQueryData(
          expenseKeys.detail(data.expense._id),
          data
        );
      }
    },
  });
};

// Update expense mutation
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateExpenseRequest }) => 
      expenseService.updateExpense(id, updates),
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      
      // Invalidate related data
      if (data?.expense.groupId) {
        const groupId = typeof data.expense.groupId === 'string' 
          ? data.expense.groupId 
          : data.expense.groupId._id;
          
        queryClient.invalidateQueries({ 
          queryKey: ['balances'] 
        });
      }
    },
  });
};

// Delete expense mutation
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: expenseKeys.detail(id) });
      
      // Invalidate lists and related data
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};

// Add comment mutation
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => 
      expenseService.addComment(id, text),
    onSuccess: (_, variables) => {
      // Invalidate expense details to refresh comments
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
    },
  });
};

// Update split status mutation
export const useUpdateSplitStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'acknowledged' | 'paid' | 'settled' }) => 
      expenseService.updateSplitStatus(id, status),
    onSuccess: (_, variables) => {
      // Invalidate expense details and balances
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });
};