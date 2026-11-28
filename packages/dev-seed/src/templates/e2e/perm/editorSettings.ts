/**
 * The contestant-app settings of the datasets on which an organization's editor works.
 *
 * Kept apart from `./shared`: the deployed smoke reads the smoke template, which imports `./shared`, without building the workspace, so `./shared` must import no workspace package by value.
 */
import { mergeSettings } from '@openvaa/app-shared';
import { MINIMAL_BASE_APP_SETTINGS } from './shared';

/** The minimal base's `contestantApp` root with organizations served too, registering by no mode: the root of the datasets on which an organization's editor works. */
export const EDITOR_CONTESTANT_APP_SETTINGS = mergeSettings(MINIMAL_BASE_APP_SETTINGS.contestantApp, {
  servedEntityTypes: { organization: { registrationModes: [] } }
});
