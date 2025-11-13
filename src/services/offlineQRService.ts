import { openDB, IDBPDatabase, DBSchema } from 'idb';

// IndexedDB schema for offline QR scans
interface OfflineQRDB extends DBSchema {
  qr_scans: {
    key: string;
    value: {
      id: string;
      qrData: string;
      amount?: number;
      note?: string;
      timestamp: number;
      status: 'pending' | 'synced' | 'failed';
      retryCount: number;
      deviceInfo?: {
        userAgent: string;
        platform: string;
        isMobile: boolean;
      };
      scanMethod: 'camera' | 'file_upload' | 'manual_input';
      metadata?: any;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

class OfflineQRService {
  private static instance: OfflineQRService;
  private db: IDBPDatabase<OfflineQRDB> | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  private constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  public static getInstance(): OfflineQRService {
    if (!OfflineQRService.instance) {
      OfflineQRService.instance = new OfflineQRService();
    }
    return OfflineQRService.instance;
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<OfflineQRDB>('offline-qr-db', 1, {
        upgrade(db) {
          // Create QR scans store
          const qrStore = db.createObjectStore('qr_scans', { keyPath: 'id' });
          qrStore.createIndex('timestamp', 'timestamp');
          qrStore.createIndex('status', 'status');

          // Create settings store
          db.createObjectStore('settings', { keyPath: 'key' });
        },
      });
      console.log('Offline QR database initialized');
    } catch (error) {
      console.error('Failed to initialize offline QR database:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored - syncing offline QR scans');
      this.syncPendingScans();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost - QR scans will be stored offline');
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingScans();
      }
    }, 30000); // Every 30 seconds
  }

  public isConnected(): boolean {
    return this.isOnline;
  }

  public async storeOfflineQRScan(qrScanData: {
    qrData: string;
    amount?: number;
    note?: string;
    scanMethod?: 'camera' | 'file_upload' | 'manual_input';
    metadata?: any;
  }): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scan = {
      id,
      qrData: qrScanData.qrData,
      amount: qrScanData.amount || 0,
      note: qrScanData.note || '',
      timestamp: Date.now(),
      status: 'pending' as const,
      retryCount: 0,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      },
      scanMethod: qrScanData.scanMethod || 'camera',
      metadata: qrScanData.metadata
    };

    await this.db.put('qr_scans', scan);
    console.log('QR scan stored offline:', id);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => this.syncPendingScans(), 1000);
    }

    return id;
  }

  public async getPendingScans(): Promise<any[]> {
    if (!this.db) return [];
    
    const scans = await this.db.getAllFromIndex('qr_scans', 'status', 'pending');
    return scans.sort((a, b) => a.timestamp - b.timestamp);
  }

  public async getAllOfflineScans(): Promise<any[]> {
    if (!this.db) return [];
    
    return await this.db.getAll('qr_scans');
  }

  public async deleteOfflineScan(id: string): Promise<void> {
    if (!this.db) return;
    
    await this.db.delete('qr_scans', id);
  }

  public async clearSyncedScans(): Promise<void> {
    if (!this.db) return;
    
    const syncedScans = await this.db.getAllFromIndex('qr_scans', 'status', 'synced');
    const tx = this.db.transaction('qr_scans', 'readwrite');
    
    for (const scan of syncedScans) {
      // Keep synced scans for 7 days for history
      if (Date.now() - scan.timestamp > 7 * 24 * 60 * 60 * 1000) {
        await tx.store.delete(scan.id);
      }
    }
    
    await tx.done;
  }

  private async syncPendingScans(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || !this.db) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting QR scan sync...');

    try {
      const pendingScans = await this.getPendingScans();
      
      if (pendingScans.length === 0) {
        console.log('No pending QR scans to sync');
        return;
      }

      console.log(`Syncing ${pendingScans.length} pending QR scans`);
      let syncedCount = 0;
      let failedCount = 0;

      for (const scan of pendingScans) {
        try {
          await this.syncSingleScan(scan);
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync scan ${scan.id}:`, error);
          await this.incrementRetryCount(scan.id);
          failedCount++;
        }
      }

      console.log(`QR scan sync completed: ${syncedCount} synced, ${failedCount} failed`);
      
      // Dispatch custom event to notify UI
      window.dispatchEvent(new CustomEvent('qr-sync-completed', {
        detail: { syncedCount, failedCount, totalPending: pendingScans.length }
      }));

    } catch (error) {
      console.error('QR scan sync failed:', error);
    } finally {
      this.syncInProgress = false;
      
      // Clean up old synced scans
      setTimeout(() => this.clearSyncedScans(), 5000);
    }
  }

  private async syncSingleScan(scan: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Import the API client dynamically to avoid circular dependencies
      const { qrScannerAPI } = await import('@/lib/qrScannerAPI');
      
      // Process the QR scan through the API
      const result = await qrScannerAPI.processQRScan({
        qrData: scan.qrData,
        amount: scan.amount,
        note: scan.note
      });

      // Mark as synced
      await this.db.put('qr_scans', {
        ...scan,
        status: 'synced',
        syncedAt: Date.now(),
        result
      });

      console.log(`Successfully synced QR scan: ${scan.id}`);
      
    } catch (error: any) {
      // If max retries reached, mark as failed
      if (scan.retryCount >= 3) {
        await this.db.put('qr_scans', {
          ...scan,
          status: 'failed',
          errorMessage: error.message || 'Max retries exceeded'
        });
        console.log(`QR scan marked as failed after max retries: ${scan.id}`);
      } else {
        throw error; // Re-throw to increment retry count
      }
    }
  }

  private async incrementRetryCount(scanId: string): Promise<void> {
    if (!this.db) return;

    const scan = await this.db.get('qr_scans', scanId);
    if (scan) {
      scan.retryCount += 1;
      await this.db.put('qr_scans', scan);
    }
  }

  public async getOfflineStats(): Promise<{
    totalStored: number;
    pendingSync: number;
    syncedToday: number;
    failedSync: number;
  }> {
    if (!this.db) {
      return { totalStored: 0, pendingSync: 0, syncedToday: 0, failedSync: 0 };
    }

    const allScans = await this.getAllOfflineScans();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const stats = {
      totalStored: allScans.length,
      pendingSync: allScans.filter(scan => scan.status === 'pending').length,
      syncedToday: allScans.filter(scan => 
        scan.status === 'synced' && 
        (scan.syncedAt || scan.timestamp) >= todayTimestamp
      ).length,
      failedSync: allScans.filter(scan => scan.status === 'failed').length
    };

    return stats;
  }

  public async retryFailedScans(): Promise<void> {
    if (!this.db || !this.isOnline) return;

    const failedScans = await this.db.getAllFromIndex('qr_scans', 'status', 'failed');
    
    for (const scan of failedScans) {
      // Reset to pending and clear retry count for manual retry
      await this.db.put('qr_scans', {
        ...scan,
        status: 'pending',
        retryCount: 0,
        errorMessage: undefined
      });
    }

    // Trigger sync
    setTimeout(() => this.syncPendingScans(), 1000);
  }

  public async exportOfflineData(): Promise<string> {
    const allScans = await this.getAllOfflineScans();
    const stats = await this.getOfflineStats();
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      stats,
      scans: allScans.map(scan => ({
        ...scan,
        exportNote: 'Exported from offline storage'
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Settings management
  public async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) return;
    
    await this.db.put('settings', {
      key,
      value,
      updatedAt: Date.now()
    });
  }

  public async getSetting(key: string, defaultValue?: any): Promise<any> {
    if (!this.db) return defaultValue;
    
    const setting = await this.db.get('settings', key);
    return setting ? setting.value : defaultValue;
  }
}

// Export singleton instance
export const offlineQRService = OfflineQRService.getInstance();

// Export types for use in components
export interface OfflineQRScan {
  id: string;
  qrData: string;
  amount?: number;
  note?: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
  };
  scanMethod: 'camera' | 'file_upload' | 'manual_input';
  metadata?: any;
  syncedAt?: number;
  errorMessage?: string;
  result?: any;
}