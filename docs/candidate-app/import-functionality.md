# ⛔️Currenlty unavailable⛔️ Import functionality

> The `import-export-entries` plugin is not compatible with Node 20 or Strapi 5. It is thus enabled and should be rewritten as a standalone plugin.

The import functionality has been implemented using the `import-export-entries` strapi plugin. The plugin has been forked and edited to suit our needs.

The forked plugin repo: https://github.com/OpenVAA/strapi-plugin-import-export-entries

## Usage

The import functionality has been implemented for the `Candidate` and `Nomination` content types.

### `Candidate` or combined `Candidate`, `Nomination` and `Answer` import

The candidate import accepts csv files that have defined the following properties:

- `firstName` (text)
- `lastName` (text)
- `party` (id, optional)
- `email` (text)
- `published` (true / false)
- optional nomination properties:
  - `election` (id)
  - `constituency` (id)
- optional answers to questions in the format (see the [example csv](./import-candidates-example.csv) for string quoting):
  - `question_<ID>` (JSON string) The `value` property of the `Answer` object
  - `question_<ID>_info` (JSON string) The `openAnswer` property of the `Answer` object

The `email` field is used as the unique identifier for candidates.

If the nomination properties are defined, a `Nomination` will also be created or updated.

If any question properties are defined, `Answer` objects will be created for each question.

Import fails and error messages are displayed if there are any of the following problems with the data:

- Candidate doesn't have all the required fields (firstName, lastName, email, published)
- Email field is empty
- Email is not unique
- Party id is defined but not valid
- Election id is defined but not valid
- Constituency id is defined but not valid
- Only one of either election or constituency ids is defined
- Any question id in the question columns is not valid
- Any question column does is malformed
- Any question field value cannot be parsed as JSON

An [example of candidate import csv](./import-candidates-example.csv):

```csv
firstName,lastName,email,published,election,constituency,electionSymbol,question_1,question_1_info
Alice,Aardvark,alice@aardvark.com,true,1,3,35,3,"""I don’t know"""
Bob,Buttons,bob@buttons.com,false,,,,3,"{""en"": ""I do know""}"
```

### `Nomination` import

The nomination import accepts csv files that have defined the following properties:

- `election` (id)
- `constituency` (id)
- `email` (text)
- `party` (id, optional)
- `electionSymbol` (text)
- `published` (true / false)

The composite of the fields `election`, `constituency`, `email` and `party` is used as the unique identifier for nominations.

Import fails and error messages are displayed if there are any of the following problems with the data:

- Nomination doesn't have all the required fields (election, constituency, candidate, electionSymbol, published)
- Email field is empty
- Email is not email of some candidate
- Each combination of election, constituency, candidate and party is not unique
- Election, constituency or party id (if defined) is not valid

Here is an example csv for the nomination import:

```
election,constituency,email,party,electionSymbol,published
<electionId>,<constituencyId>,alice@example.com,<partyId>,1,true
<electionId>,<constituencyId>,bob@example.com,,2,false
```
