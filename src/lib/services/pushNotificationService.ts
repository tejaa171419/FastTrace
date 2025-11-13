import { apiClient } from '@/lib/api';
import notificationServiceMock from './notificationServiceMock';

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Register service worker and initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Push notifications are not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Subscribe to push notifications
      const subscription = await this.subscribeToPush();
      if (subscription) {
        // Send subscription to backend
        await this.sendSubscriptionToServer(subscription);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return null;
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
          'BKd0bW7m1lX7Pg_mHwKoULgPqVKGYqmJGbY3cKdJYzJYeFjI3QcvJF1Vf5bMvH2l6HtLmVXkYH3vR5GhDn5Y6Qc';
        
        const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
        
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Send push subscription to backend
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await apiClient.post('/notifications/push/subscribe', {
        subscription: subscription.toJSON()
      });
      console.log('Push subscription sent to server');
    } catch (error: any) {
      // Use mock service if API not available
      if (error.status === 404 || error.message?.includes('Not found')) {
        console.warn('Push API not available, using mock service');
        await notificationServiceMock.subscribeToPush(subscription.toJSON());
        return;
      }
      console.error('Failed to send push subscription to server:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();
        
        // Notify backend
        try {
          await apiClient.post('/notifications/push/unsubscribe', {
            endpoint: subscription.endpoint
          });
        } catch (error: any) {
          if (error.status === 404 || error.message?.includes('Not found')) {
            await notificationServiceMock.unsubscribeFromPush(subscription.endpoint);
          } else {
            throw error;
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Check if user is subscribed to push notifications
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }

  /**
   * Send local notification (for testing)
   */
  async sendLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    await this.registration.showNotification(title, {
      body: options?.body || '',
      icon: options?.icon || '/icon-192x192.png',
      badge: options?.badge || '/badge-72x72.png',
      vibrate: options?.vibrate || [100, 50, 100],
      data: options?.data || {},
      tag: options?.tag || 'default',
      requireInteraction: options?.requireInteraction || false,
      ...options
    });
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(tag: string = 'sync-notifications'): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      console.log('Background sync not supported');
      return;
    }

    try {
      await (this.registration as any).sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  setupMessageHandler(handler: (event: MessageEvent) => void): void {
    navigator.serviceWorker.addEventListener('message', handler);
  }

  /**
   * Send message to service worker
   */
  async sendMessageToServiceWorker(message: any): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.error('Service worker not active');
      return;
    }

    this.registration.active.postMessage(message);
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('Service worker update check completed');
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Check if push notifications are supported and enabled
   */
  isPushEnabled(): boolean {
    return this.isSupported && Notification.permission === 'granted';
  }
}

// Create and export singleton instance
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;