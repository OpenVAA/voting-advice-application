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

Import fails and error messages are displayed if there are any of the following problems with the data:

 - Candidate doesn't have all the required fields (firstName, lastName, party, email, published)
 - Email field is empty
 - Email is not unique
 - Party id is not valid

Here is an example csv for the candidate import:
```
firstName,lastName,party,email,published
Alice,Alice,<partyId>,alice@example.com,true
Bob,Bob,<partyId>,bob@example.com,false
```

The nomination import accepts csv files that have defined the following properties:
 - `election` (id)
 - `constituency` (id)
 - `email` (text)
 - `party` (id)
 - `electionSymbol` (text)
 - `published` (true / false)

The composite of the fields `election`, `constituency`, `email` and `party` is used as the unique identifier for nominations.

Import fails and error messages are displayed if there are any of the following problems with the data:

 - Nomination doesn't have all the required fields (election, constituency, candidate, party, electionSymbol, published)
 - Email field is empty
 - Email is not email of some candidate
 - Each combination of election, constituency, candidate and party is not unique
 - Election, constituency or party id is not valid

Here is an example csv for the nomination import:
```
election,constituency,email,party,electionSymbol,published
<electionId>,<constituencyId>,alice@example.com,<partyId>,1,true
<electionId>,<constituencyId>,bob@example.com,<partyId>,2,false
```


## Implementation details

The import functionality has been implemented by modifying the [import-export-entries strapi plugin](https://market.strapi.io/plugins/strapi-plugin-import-export-entries).

The following files have been changed:

### [admin/src/components/ImportButton/ImportButton.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/admin/src/components/ImportButton/ImportButton.js)

The file was modified so that the import button is only visible on certain pages. The pages that it is visible on is hard coded into the file.

### [admin/src/components/ImportModal/ImportModal.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/admin/src/components/ImportModal/ImportModal.js)

Originally, the plugin had an option to write the csv directly into the modal. This file was modified so that the text editor is hidden.

### [admin/src/components/ImportModal/components/ImportEditor](../../backend/vaa-strapi/strapi-plugin-import-export-entries/admin/src/components/ImportModal/components/ImportEditor/ImportEditor.js)

Originally, the import modal had an option tab for choosing the id field. This was removed as it is not needed.

### [admin/src/index.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/admin/src/index.js)

In this file, the export button and editView options were made hidden.

### [src/server/services/import/import.js](../../backend/vaa-strapi/strapi-plugin-import-export-entries/src/server/services/import/import.js)

This is the main file for the import logic. In this file, new functions were created for importing candidates and nominations. These functions contain custom logic that the original plugin didn't support.
