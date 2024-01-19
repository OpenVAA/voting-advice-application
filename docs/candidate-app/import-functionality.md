# Import functionality

The import functionality has been implemented using the import-export-entries strapi plugin. The plugin has been forked and edited to suit our needs.

The forked plugin repo: https://github.com/OpenVAA/strapi-plugin-import-export-entries

## Usage

The import functionality has been implemented for the Candidate and Nomination content types.

The candidate import accepts csv files that have defined the following properties:
 - `firstName` (text)
 - `lastName` (text)
 - `party` (id)
 - `email` (text)
 - `published` (true / false)

The `email` field is used as the unique identifier for candidates.


The nomination import accepts csv files that have defined the following properties:
 - `election` (id)
 - `constituency` (id)
 - `candidate` (id)
 - `party` (id)
 - `electionSymbol` (text)
 - `published` (true / false)

The composite of the fields `election`, `constituency`, `candidate` and `party` is used as the unique identifier for nominations.

The import will fail if one or more of the fields are not defined.

## Implementation details

The import functionality has been implemented by modifying the [import-export-entries strapi plugin](https://market.strapi.io/plugins/strapi-plugin-import-export-entries).

The following files have been changed:

### [admin/src/components/ImportButton/ImportButton.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/admin/src/components/ImportButton/ImportButton.js)

The file was modified so that the import button is only visible on certain pages. The pages that it is visible on is hard coded into the file.

### [admin/src/components/ImportModal/ImportModal.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/admin/src/components/ImportModal/ImportModal.js)

Originally, the plugin had an option to write the csv directly into the modal. This file was modified so that the text editor is hidden.

### [admin/src/index.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/admin/src/index.js)

In this file, the export button and editView options were made hidden.

### [src/server/services/import/import.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/src/server/services/import/import.js)

This is the main file for the import logic. In this file, new functions were created for importing candidates and nominations. These functions contain custom logic that the original plugin didn't support.
