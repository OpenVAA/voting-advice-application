/**
 * Non-exhaustive specification of the app labels.
 * TODO: Comletely specify available labels here and convert all $_
 * calls that depend on i18n/en.json to using AppLabels instead.
 */
export interface AppLabels {
  name: string;
  appTitle: string;
  actionLabels: Record<string, string>;
  viewTexts: Record<string, string>;
}
