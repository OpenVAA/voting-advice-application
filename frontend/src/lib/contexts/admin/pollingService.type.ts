/**
 * A smart polling service that automatically starts/stops based on active job count
 */
export type PollingService = {
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: () => boolean;
  /**
   * Force a manual refresh
   */
  refresh: () => Promise<void>;
};
