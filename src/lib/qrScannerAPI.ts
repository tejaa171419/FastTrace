import { apiClient } from '@/lib/api';

// Types for QR Scanner API
export interface QRScanData {
  qrData: string;
  amount?: number;
  note?: string;
}

export interface GroupExpenseData {
  groupId: string;
  amount: number;
  note?: string;
  selectedMembers: string[];
  splitMethod?: 'equal' | 'percentage' | 'custom';
}

export interface GroupDetails {
  id: string;
  name: string;
  icon: string;
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

export interface QRScanResult {
  type: 'upi' | 'merchant' | 'expense_split' | 'unknown';
  upiId?: string;
  merchantName?: string;
  merchantId?: string;
  groupId?: string;
  groupName?: string;
  groupIcon?: string;
  amount?: number;
  note?: string;
  members?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  raw?: string;
  orderId?: string;
  razorpayKeyId?: string;
  paymentId?: string;
}

export interface GroupExpenseResult {
  expense: any;
  payment: any;
}

// QR Scanner API service
export class QRScannerAPI {
  private static instance: QRScannerAPI;

  // Singleton pattern
  public static getInstance(): QRScannerAPI {
    if (!QRScannerAPI.instance) {
      QRScannerAPI.instance = new QRScannerAPI();
    }
    return QRScannerAPI.instance;
  }

  /**
   * Process QR code scan and initiate payment with retry mechanism
   */
  public async processQRScan(scanData: QRScanData, retryCount: number = 0): Promise<QRScanResult> {
    const maxRetries = 3;
    const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 5000);

    try {
      const response = await apiClient.post<{ success: boolean; data: QRScanResult }>(
        '/api/qr-scan/process',
        scanData
      );
      
      if (!response.success) {
        throw new Error('Failed to process QR scan');
      }

      return response.data;
    } catch (error: any) {
      console.error(`QR scan processing error (attempt ${retryCount + 1}):`, error);
      
      // Don't retry on client errors (4xx) except for specific cases
      const shouldRetry = this.shouldRetryError(error) && retryCount < maxRetries;
      
      if (shouldRetry) {
        console.log(`Retrying QR scan processing in ${retryDelay(retryCount)}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay(retryCount)));
        return this.processQRScan(scanData, retryCount + 1);
      }
      
      throw this.enhanceError(error, 'QR scan processing');
    }
  }

  /**
   * Process group expense split payment with retry mechanism
   */
  public async processGroupExpenseSplit(expenseData: GroupExpenseData, retryCount: number = 0): Promise<GroupExpenseResult> {
    const maxRetries = 2;
    const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 4000);

    try {
      const response = await apiClient.post<{ success: boolean; data: GroupExpenseResult }>(
        '/api/qr-scan/group-expense',
        expenseData
      );
      
      if (!response.success) {
        throw new Error('Failed to process group expense split');
      }

      return response.data;
    } catch (error: any) {
      console.error(`Group expense split error (attempt ${retryCount + 1}):`, error);
      
      const shouldRetry = this.shouldRetryError(error) && retryCount < maxRetries;
      
      if (shouldRetry) {
        console.log(`Retrying group expense split in ${retryDelay(retryCount)}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay(retryCount)));
        return this.processGroupExpenseSplit(expenseData, retryCount + 1);
      }
      
      throw this.enhanceError(error, 'Group expense split');
    }
  }

  /**
   * Get group details for QR scanning with retry mechanism
   */
  public async getGroupDetails(groupId: string, retryCount: number = 0): Promise<GroupDetails> {
    const maxRetries = 2;
    const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 3000);

    try {
      const response = await apiClient.get<{ success: boolean; data: { group: GroupDetails } }>(
        `/api/qr-scan/group/${groupId}`
      );
      
      if (!response.success) {
        throw new Error('Failed to get group details');
      }

      return response.data.group;
    } catch (error: any) {
      console.error(`Get group details error (attempt ${retryCount + 1}):`, error);
      
      const shouldRetry = this.shouldRetryError(error) && retryCount < maxRetries;
      
      if (shouldRetry) {
        console.log(`Retrying group details fetch in ${retryDelay(retryCount)}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay(retryCount)));
        return this.getGroupDetails(groupId, retryCount + 1);
      }
      
      throw this.enhanceError(error, 'Group details fetch');
    }
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetryError(error: any): boolean {
    // Retry on network errors, server errors (5xx), and rate limiting
    if (!error.statusCode) return true; // Network error
    if (error.statusCode >= 500) return true; // Server error
    if (error.statusCode === 429) return true; // Rate limited
    if (error.statusCode === 408) return true; // Request timeout
    if (error.statusCode === 502) return true; // Bad gateway
    if (error.statusCode === 503) return true; // Service unavailable
    if (error.statusCode === 504) return true; // Gateway timeout
    
    return false; // Don't retry client errors (4xx) except above
  }

  /**
   * Enhance error with user-friendly message
   */
  private enhanceError(error: any, operation: string): Error {
    let message = `${operation} failed`;
    
    if (error.statusCode) {
      switch (error.statusCode) {
        case 400:
          message = 'Invalid QR code or request data';
          break;
        case 401:
          message = 'Authentication required. Please log in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action';
          break;
        case 404:
          message = 'Requested resource not found';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          message = 'Server error occurred. Please try again.';
          break;
        case 502:
        case 503:
        case 504:
          message = 'Service temporarily unavailable. Please try again.';
          break;
        default:
          message = error.message || `${operation} failed unexpectedly`;
      }
    } else if (error.message?.includes('fetch')) {
      message = 'Network connection error. Please check your internet connection.';
    } else {
      message = error.message || `${operation} failed unexpectedly`;
    }
    
    const enhancedError = new Error(message);
    enhancedError.cause = error;
    return enhancedError;
  }
}

// Export singleton instance
export const qrScannerAPI = QRScannerAPI.getInstance();