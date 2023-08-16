import type {Settings} from '$lib/stores';
import type {DataProvider} from '$lib/vaa-data';
import type {AppLabels} from '$types/appLabels.type';

/**
 * These configurations are needed for the app instance.
 */
export interface AppConfig {
  getAppLabels(): Promise<AppLabels>;
  getAppSettings(): Promise<Settings>;
  getDataProvider(): DataProvider;
}
