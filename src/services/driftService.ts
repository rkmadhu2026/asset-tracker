
import { sendEmailNotification } from './notificationService';
import { driftsApi } from '../lib/api';

export const detectDrift = async (deviceId: string, config: string) => {
  const isDrift = Math.random() > 0.5;

  if (isDrift) {
    await sendEmailNotification(
      `Configuration Drift Detected: ${deviceId}`,
      `A configuration drift has been detected for device ${deviceId}. Please review the configuration.`
    );
    await driftsApi.create({ device_id: deviceId, status: 'Open' });
  }

  return isDrift;
};
