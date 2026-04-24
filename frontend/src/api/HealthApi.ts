import ApiClient from './ApiClient';
import { BatchHealthRequest } from '../types/health';

export const HealthApi = {
  async sendHealthSnapshot(payload: BatchHealthRequest): Promise<void> {
    await ApiClient.post('/api/v1/health/sync', payload);
  },
};
