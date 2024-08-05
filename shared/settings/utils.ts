import {
  defaultDynamicSettings,
  defaultStaticSettings,
  dynamicSettings,
  staticSettings,
  type DynamicSettings
} from './';

export const mergedStaticSettings = {...defaultStaticSettings, ...staticSettings};

export function mergedDynamicSettings(
  dataProviderDynamicSettings?: Partial<DynamicSettings>
): DynamicSettings {
  if (dataProviderDynamicSettings) {
    // Null values are filtered to avoid overriding values of defaultDynamiSettings or dynamicSettings with null.
    const filtered = Object.fromEntries(
      Object.entries(dataProviderDynamicSettings).filter(([, value]) => value)
    );
    return {...defaultDynamicSettings, ...dynamicSettings, ...filtered};
  }
  return {...defaultDynamicSettings, ...dynamicSettings};
}
