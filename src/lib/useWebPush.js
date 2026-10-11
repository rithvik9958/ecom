'use client';
import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush(role = 'customer') {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register SW if not already registered
      navigator.serviceWorker.register('/sw.js')
        .then(async (registration) => {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        })
        .catch(err => console.log('[SW Registration notice]:', err?.message));
    }
  }, []);

  const subscribe = useCallback(async (userEmail = null) => {
    if (!isSupported) return { success: false, message: 'Push notifications are not supported in this browser.' };

    setLoading(true);
    try {
      // 1. Request Browser Permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setLoading(false);
        return { success: false, message: 'Notification permission was denied.' };
      }

      // 2. Fetch Public VAPID Key
      const keyRes = await fetch('/api/web-push/subscribe');
      const keyData = await keyRes.json();
      const vapidPublicKey = keyData.publicKey;

      if (!vapidPublicKey) {
        throw new Error('VAPID public key is missing on the server.');
      }

      // 3. Subscribe on PushManager
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // 4. Send subscription to server
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          role,
          userEmail
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        return { success: true, message: 'Push notifications activated successfully!' };
      } else {
        throw new Error(data.message || 'Failed to save subscription');
      }
    } catch (err) {
      console.error('[useWebPush Subscribe Error]', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [isSupported, role]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch(`/api/web-push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE'
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return { success: true, message: 'Push notifications deactivated.' };
    } catch (err) {
      console.error('[useWebPush Unsubscribe Error]', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe
  };
}
