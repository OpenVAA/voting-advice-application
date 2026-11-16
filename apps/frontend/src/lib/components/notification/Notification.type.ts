import type { NotificationData } from '@openvaa/app-shared';
import type { AlertProps } from '$lib/components/alert';

export type NotificationProps = Partial<AlertProps> & {
  /**
   * The data for the notification to show.
   */
  data: Omit<NotificationData, 'show'>;
};
