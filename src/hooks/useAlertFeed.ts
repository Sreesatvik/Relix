import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert } from '../types';
import { getIncident } from '../api';

export interface AlertFeedState {
  latestAlert: Alert | null;
  allAlerts: Alert[];
  dismissAlert: () => void;
  triggerManualAlert: (alert: Alert) => void;
  isConnected: boolean;
  lastUpdated: string;
}

export function useAlertFeed(): AlertFeedState {
  const location = useLocation();
  const currentRole = location.pathname.includes('/manager') ? 'plant_manager' :
                      location.pathname.includes('/supervisor') ? 'supervisor' :
                      location.pathname.includes('/maintenance') ? 'maintenance' : '';

  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Not connected');

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // max 30s
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dismissAlert = useCallback(() => {
    setLatestAlert(null);
  }, []);

  const triggerManualAlert = useCallback((alert: Alert) => {
    setLatestAlert(alert);
    setAllAlerts((prev) => [alert, ...prev]);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws/alerts';
    
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      setLastUpdated(new Date().toLocaleTimeString());
      reconnectAttempts.current = 0;
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        // Only process Alert objects (ignore incident status updates sent by ws_manager)
        if (data.alert_id && data.routed_roles && Array.isArray(data.routed_roles)) {
          // Check if current role is in routed_roles
          if (currentRole && data.routed_roles.includes(currentRole)) {
            const alert = data as Alert;
            setLatestAlert(alert);
            setAllAlerts((prev) => {
              // prevent duplicates
              if (prev.some(a => a.alert_id === alert.alert_id)) return prev;
              return [alert, ...prev];
            });

            // Fetch latest incident data and dispatch event for pages to update
            try {
              const updatedIncident = await getIncident(alert.incident_id);
              window.dispatchEvent(new CustomEvent('incidentRefresh', { detail: updatedIncident }));
            } catch (err) {
              console.error('Failed to refresh incident data after alert:', err);
            }
          }
        }
      } catch (err) {
        console.error('Malformed WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      
      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), maxReconnectDelay);
      reconnectAttempts.current += 1;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
      // Let onclose handle reconnect
    };
  }, [currentRole]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connectWebSocket]);

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
