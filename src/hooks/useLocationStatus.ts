import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getLocalJourney, getLocationStatus, LocalJourney, LocationStatus, subscribeLocationState } from '../services/location/state';
import { logger } from '../utils/logger';

export function useLocationStatus() {
  const [status, setStatus] = useState<LocationStatus | null>(null);
  const [journey, setJourney] = useState<LocalJourney | null>(null);
  useEffect(() => {
    let alive = true;
    let poll: ReturnType<typeof setInterval> | undefined;
    let previousStatus: LocationStatus | null = null;
    let previousJourney: LocalJourney | null = null;
    const read = async () => {
      try {
        const [nextStatus, nextJourney] = await Promise.all([getLocationStatus(), getLocalJourney()]);
        if (!alive) return;
        if (JSON.stringify(previousStatus) !== JSON.stringify(nextStatus)) {
          previousStatus = nextStatus;
          setStatus(nextStatus);
        }
        if (JSON.stringify(previousJourney) !== JSON.stringify(nextJourney)) {
          previousJourney = nextJourney;
          setJourney(nextJourney);
        }
      } catch (error) {
        logger.warn('location_status_read_failed', { message: String(error).slice(0, 100) });
      }
    };
    const startPolling = () => {
      if (!poll) poll = setInterval(() => void read(), 15_000);
    };
    const stopPolling = () => {
      if (poll) clearInterval(poll);
      poll = undefined;
    };
    void read();
    const unsub = subscribeLocationState(() => void read());
    // Background task writes can use a separate runtime; refresh after returning and poll slowly.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void read();
        startPolling();
      } else {
        stopPolling();
      }
    });
    if (AppState.currentState === 'active') startPolling();
    return () => {
      alive = false;
      unsub();
      sub.remove();
      stopPolling();
    };
  }, []);
  return { status, journey };
}
