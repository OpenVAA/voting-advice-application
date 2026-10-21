/*
 * Event names the data provider reports parse failures under. Each is a constant, never an interpolation: sinks key events on the message, and every varying value belongs in the record's attributes. Changing a name therefore breaks any sink keyed on it.
 * Neither name claims what was kept, because partial preserve keeps a varying amount; the record's `preserved` attribute carries that.
 */

/** Reported when `app_settings.customization` does not match its schema. */
export const CUSTOMIZATION_PARSE_FAILURE_MESSAGE = 'A stored app customization did not match its schema.';

/** Reported when `app_settings.settings` does not match its schema. */
export const SETTINGS_PARSE_FAILURE_MESSAGE = 'Stored application settings did not match their schema.';
