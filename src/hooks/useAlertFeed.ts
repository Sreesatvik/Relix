import { useState, useEffect, useCallback } from 'react';
import mockAlertsData from '../../frontend/mocks/alerts.json';
import { Alert } from '../types';

export interface AlertFeedState {
  latestAlert: Alert | null;
  allAlerts: Alert[];
  dismissAlert: () => void;
  triggerManualAlert: (alert: Alert) => void;
  isConnected: boolean;
  lastUpdated: string;
}

/**
 * useAlertFeed Hook
 * 
 * Isolates all real-time / streaming alert ingestion logic.
 * Currently simulates scheduled alerts from mocks/alerts.json.
 * To switch to real WebSocket or SSE in production, modify ONLY this hook.
 */
export function useAlertFeed(): AlertFeedState {
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Ticking timestamp for live monitoring indicator
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastUpdated(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = useCallback(() => {
    setLatestAlert(null);
  }, []);

  const triggerManualAlert = useCallback((alert: Alert) => {
    setLatestAlert(alert);
    setAllAlerts((prev) => [alert, ...prev]);
  }, []);

  // Simulate alerts firing for jury demo
  useEffect(() => {
    const alertsList: Alert[] = mockAlertsData as Alert[];
    if (alertsList.length === 0) return;

    // Fire first alert after 2.5 seconds
    const timer1 = setTimeout(() => {
      if (alertsList[0]) {
        setLatestAlert(alertsList[0]);
        setAllAlerts((prev) => [alertsList[0], ...prev]);
      }
    }, 2500);

    // Fire second alert after 18 seconds
    const timer2 = setTimeout(() => {
      if (alertsList[1]) {
        setLatestAlert(alertsList[1]);
        setAllAlerts((prev) => [alertsList[1], ...prev]);
      }
    }, 18000);

    // Fire third alert after 36 seconds
    const timer3 = setTimeout(() => {
      if (alertsList[2]) {
        setLatestAlert(alertsList[2]);
        setAllAlerts((prev) => [alertsList[2], ...prev]);
      }
    }, 36000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Auto-dismiss latest alert toast after ~6 seconds
  useEffect(() => {
    if (!latestAlert) return;
    const autoDismiss = setTimeout(() => {
      setLatestAlert(null);
    }, 6500);
    return () => clearTimeout(autoDismiss);
  }, [latestAlert]);

  return {
    latestAlert,
    allAlerts,
    dismissAlert,
    triggerManualAlert,
    isConnected,
    lastUpdated,
  };
}
