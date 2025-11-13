import { QueryClient } from '@tanstack/react-query';
import { groupKeys } from '@/hooks/useGroups';
import { expenseKeys } from '@/hooks/useExpenses';
import { balanceKeys } from '@/hooks/useBalances';

// Real-time sync configuration - Optimized for better performance
export const SYNC_INTERVALS = {
  GROUPS: 15 * 60 * 1000, // 15 minutes (reduced from 5 minutes)
  EXPENSES: 10 * 60 * 1000, // 10 minutes (reduced from 3 minutes)  
  BALANCES: 8 * 60 * 1000, // 8 minutes (reduced from 2 minutes)
  ACTIVE_GROUP: 2 * 60 * 1000, // 2 minutes for currently viewed group (reduced from 30 seconds)
};

// Development mode configuration
const isDevelopment = import.meta.env.MODE === 'development';
const USER_ENABLE_SYNC = localStorage.getItem('enableAutoSync') === 'true';
const USER_DISABLE_SYNC = localStorage.getItem('disableAutoSync') === 'true';

// Auto-sync is disabled by default in development unless explicitly enabled
const SYNC_DISABLED = (isDevelopment && !USER_ENABLE_SYNC) || USER_DISABLE_SYNC;

// Background sync manager
export class RealtimeSyncManager {
  private queryClient: QueryClient;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private activeGroupId: string | null = null;
  private isActive: boolean = false;
  private ongoingSync: Set<string> = new Set(); // Track ongoing sync operations

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupVisibilityHandlers();
  }

  // Start real-time sync
  start() {
    if (this.isActive) return;
    
    // Check if auto-sync is disabled
    if (SYNC_DISABLED) {
      console.log('⏸️ Auto-sync disabled (development mode or user setting)');
      console.log('🛠️ To enable: localStorage.setItem("enableAutoSync", "true"); then refresh');
      return;
    }
    
    this.isActive = true;
    this.startPeriodicSync();
    console.log('🔄 Real-time sync started with optimized intervals');
  }

  // Stop real-time sync
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.clearAllIntervals();
    console.log('⏹️ Real-time sync stopped');
  }

  // Set active group for more frequent updates
  setActiveGroup(groupId: string | null) {
    this.activeGroupId = groupId;
    
    // Clear existing active group interval
    if (this.intervals.has('activeGroup')) {
      clearInterval(this.intervals.get('activeGroup')!);
      this.intervals.delete('activeGroup');
    }

    // Start new active group sync if group is selected
    if (groupId && this.isActive) {
      // Add a delay before starting active group sync to reduce initial load
      setTimeout(() => {
        if (this.isActive && this.activeGroupId === groupId) {
          const interval = setInterval(() => {
            this.syncActiveGroup(groupId);
          }, SYNC_INTERVALS.ACTIVE_GROUP);
          
          this.intervals.set('activeGroup', interval);
        }
      }, 2000); // 2 second delay
    }
  }

  // Trigger manual sync
  async triggerSync(type?: 'groups' | 'expenses' | 'balances' | 'all') {
    switch (type) {
      case 'groups':
        await this.syncGroups();
        break;
      case 'expenses':
        await this.syncExpenses();
        break;
      case 'balances':
        await this.syncBalances();
        break;
      default:
        await Promise.all([
          this.syncGroups(),
          this.syncExpenses(),
          this.syncBalances()
        ]);
    }
  }

  // Private methods
  private startPeriodicSync() {
    // Groups sync - delayed start
    setTimeout(() => {
      if (this.isActive) {
        const groupsInterval = setInterval(() => {
          this.syncGroups();
        }, SYNC_INTERVALS.GROUPS);
        this.intervals.set('groups', groupsInterval);
      }
    }, 1000); // 1 second delay

    // Expenses sync - delayed start
    setTimeout(() => {
      if (this.isActive) {
        const expensesInterval = setInterval(() => {
          this.syncExpenses();
        }, SYNC_INTERVALS.EXPENSES);
        this.intervals.set('expenses', expensesInterval);
      }
    }, 2000); // 2 second delay

    // Balances sync - delayed start
    setTimeout(() => {
      if (this.isActive) {
        const balancesInterval = setInterval(() => {
          this.syncBalances();
        }, SYNC_INTERVALS.BALANCES);
        this.intervals.set('balances', balancesInterval);
      }
    }, 3000); // 3 second delay
  }

  private clearAllIntervals() {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
  }

  private async syncGroups() {
    if (this.ongoingSync.has('groups')) {
      console.log('⏭️ Skipping groups sync - already in progress');
      return;
    }
    
    this.ongoingSync.add('groups');
    try {
      await this.queryClient.invalidateQueries({ 
        queryKey: groupKeys.lists(),
        refetchType: 'active'
      });
    } catch (error) {
      console.warn('Groups sync failed:', error);
    } finally {
      this.ongoingSync.delete('groups');
    }
  }

  private async syncExpenses() {
    if (this.ongoingSync.has('expenses')) {
      console.log('⏭️ Skipping expenses sync - already in progress');
      return;
    }
    
    this.ongoingSync.add('expenses');
    try {
      await this.queryClient.invalidateQueries({ 
        queryKey: expenseKeys.lists(),
        refetchType: 'active'
      });
    } catch (error) {
      console.warn('Expenses sync failed:', error);
    } finally {
      this.ongoingSync.delete('expenses');
    }
  }

  private async syncBalances() {
    if (this.ongoingSync.has('balances')) {
      console.log('⏭️ Skipping balances sync - already in progress');
      return;
    }
    
    this.ongoingSync.add('balances');
    try {
      await this.queryClient.invalidateQueries({ 
        queryKey: balanceKeys.lists(),
        refetchType: 'active'
      });
    } catch (error) {
      console.warn('Balances sync failed:', error);
    } finally {
      this.ongoingSync.delete('balances');
    }
  }

  private async syncActiveGroup(groupId: string) {
    const syncKey = `activeGroup-${groupId}`;
    if (this.ongoingSync.has(syncKey)) {
      console.log('⏭️ Skipping active group sync - already in progress');
      return;
    }
    
    this.ongoingSync.add(syncKey);
    try {
      await Promise.all([
        this.queryClient.invalidateQueries({ 
          queryKey: groupKeys.detail(groupId),
          refetchType: 'active'
        }),
        this.queryClient.invalidateQueries({ 
          queryKey: expenseKeys.list({ groupId }),
          refetchType: 'active'
        }),
        this.queryClient.invalidateQueries({ 
          queryKey: balanceKeys.list({ groupId }),
          refetchType: 'active'
        })
      ]);
    } catch (error) {
      console.warn('Active group sync failed:', error);
    } finally {
      this.ongoingSync.delete(syncKey);
    }
  }

  private setupVisibilityHandlers() {
    // Pause/resume sync based on page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        // Add a delay when resuming sync to allow UI to render first
        setTimeout(() => {
          this.start();
        }, 1000); // 1 second delay
      }
    });

    // Handle window focus/blur
    window.addEventListener('focus', () => {
      if (!this.isActive) {
        // Add a delay when starting sync to allow UI to render first
        setTimeout(() => {
          this.start();
        }, 1000); // 1 second delay
      }
      // Trigger immediate sync when window regains focus
      setTimeout(() => {
        this.triggerSync();
      }, 500); // 500ms delay
    });

    window.addEventListener('blur', () => {
      // Don't stop sync on blur - user might just be switching tabs briefly
    });
  }
}

// Connection status monitoring
export class ConnectionMonitor {
  private queryClient: QueryClient;
  private isOnline: boolean = navigator.onLine;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupConnectionHandlers();
  }

  get connectionStatus() {
    return this.isOnline;
  }

  private setupConnectionHandlers() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnectAttempts = 0;
      this.handleReconnection();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleDisconnection();
    });
  }

  private async handleReconnection() {
    console.log('🌐 Connection restored, syncing data...');
    
    try {
      // Invalidate all queries to refresh stale data
      await this.queryClient.invalidateQueries();
      
      // Show success notification
      this.showConnectionStatus('online');
    } catch (error) {
      console.error('Failed to sync after reconnection:', error);
      this.attemptReconnect();
    }
  }

  private handleDisconnection() {
    console.log('📡 Connection lost');
    this.showConnectionStatus('offline');
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(async () => {
      try {
        // Test connection with a simple request
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          this.handleReconnection();
        } else {
          this.attemptReconnect();
        }
      } catch {
        this.attemptReconnect();
      }
    }, delay);
  }

  private showConnectionStatus(status: 'online' | 'offline') {
    // Create a simple toast-like notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
      status === 'online' 
        ? 'bg-green-500 border border-green-400' 
        : 'bg-red-500 border border-red-400'
    }`;
    notification.textContent = status === 'online' 
      ? '🌐 Back online - data synced' 
      : '📡 Connection lost - working offline';
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Optimistic updates helper
export const createOptimisticUpdate = <T>(
  queryClient: QueryClient,
  queryKey: any[],
  updateFn: (oldData: T) => T
) => {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<T>(queryKey);
      
      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<T>(queryKey, updateFn(previousData));
      }
      
      return { previousData };
    },
    onError: (err: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData<T>(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey });
    }
  };
};

// Export singleton instances
let syncManager: RealtimeSyncManager | null = null;
let connectionMonitor: ConnectionMonitor | null = null;

export const initializeRealtime = (queryClient: QueryClient) => {
  if (!syncManager) {
    syncManager = new RealtimeSyncManager(queryClient);
  }
  
  if (!connectionMonitor) {
    connectionMonitor = new ConnectionMonitor(queryClient);
  }
  
  return { syncManager, connectionMonitor };
};

export const getSyncManager = () => syncManager;
export const getConnectionMonitor = () => connectionMonitor;