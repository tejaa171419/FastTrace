/**
 * Wallet Event Emitter
 * Provides a centralized event system for wallet-related updates across components
 */

export type WalletEventType = 
  | 'balance_updated'
  | 'transaction_completed'
  | 'transaction_created'
  | 'wallet_topup'
  | 'wallet_transfer'
  | 'bank_transfer_completed';

export interface WalletEventData {
  type: WalletEventType;
  balance?: number;
  transaction?: any;
  amount?: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

class WalletEventEmitter {
  private listeners: Map<WalletEventType, Set<Function>> = new Map();
  private static instance: WalletEventEmitter;

  private constructor() {}

  static getInstance(): WalletEventEmitter {
    if (!WalletEventEmitter.instance) {
      WalletEventEmitter.instance = new WalletEventEmitter();
    }
    return WalletEventEmitter.instance;
  }

  /**
   * Subscribe to wallet events
   */
  on(eventType: WalletEventType, callback: (data: WalletEventData) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }

  /**
   * Unsubscribe from wallet events
   */
  off(eventType: WalletEventType, callback: Function): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit a wallet event
   */
  emit(eventType: WalletEventType, data: Omit<WalletEventData, 'type'>): void {
    const eventData: WalletEventData = {
      type: eventType,
      timestamp: new Date().toISOString(),
      ...data
    };

    console.log(`📢 Wallet Event Emitted: ${eventType}`, eventData);

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Error in wallet event listener for ${eventType}:`, error);
        }
      });
    }

    // Also emit via custom DOM event for compatibility
    const customEvent = new CustomEvent('wallet-event', {
      detail: eventData
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * Clear all listeners for a specific event type
   */
  clearListeners(eventType?: WalletEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(eventType: WalletEventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}

// Export singleton instance
export const walletEvents = WalletEventEmitter.getInstance();

/**
 * Helper functions for common wallet events
 */

export const emitBalanceUpdate = (balance: number, metadata?: Record<string, any>) => {
  walletEvents.emit('balance_updated', { balance, metadata });
};

export const emitTransactionCompleted = (transaction: any, metadata?: Record<string, any>) => {
  walletEvents.emit('transaction_completed', { transaction, metadata });
};

export const emitTransactionCreated = (transaction: any, metadata?: Record<string, any>) => {
  walletEvents.emit('transaction_created', { transaction, metadata });
};

export const emitWalletTopup = (amount: number, metadata?: Record<string, any>) => {
  walletEvents.emit('wallet_topup', { amount, metadata });
};

export const emitWalletTransfer = (amount: number, transaction?: any, metadata?: Record<string, any>) => {
  walletEvents.emit('wallet_transfer', { amount, transaction, metadata });
};

export const emitBankTransferCompleted = (amount: number, transaction?: any, metadata?: Record<string, any>) => {
  walletEvents.emit('bank_transfer_completed', { amount, transaction, metadata });
};

/**
 * React hook for wallet events
 */
export const useWalletEvents = () => {
  return {
    on: walletEvents.on.bind(walletEvents),
    off: walletEvents.off.bind(walletEvents),
    emit: walletEvents.emit.bind(walletEvents),
    emitBalanceUpdate,
    emitTransactionCompleted,
    emitTransactionCreated,
    emitWalletTopup,
    emitWalletTransfer,
    emitBankTransferCompleted
  };
};
