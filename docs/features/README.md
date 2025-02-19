# Features

A non-exhaustive list of the application features.

## Localization

- All texts used in the application are localizable
- All text properties of the data are localizable
- Translations can be exported and imported as `csv` files
- Translations can be easily overriden term by term
- Automatic serving of requested locale to users if available
- Currently available in
  - English
  - Finnish
  - Swedish

## Accessibility

- WGAC 2.1 AA compliant
- Automatic color contrast tuning for user-specified colors
- Mobile first design
- Light and dark mode enabled

## Customization

- Fonts and colors
- Logos
- Questions and question categories
- Available entity types
- Result sections
- Content of entity cards in lists and in the details view
- Numerous other settings which can be edited in real time via the backend
- Futher customization available by editing the source code

## Data Input

- Using Strapi Admin UI
- Using a json import tool
- Using a custom Admin UI (TBA)
- Support for a local version without Strapi
  - Data provided as flat json files
  - Does not support the Candidate App

## Elections and Constituencies

- Multiple simultaneous elections
  - Users may be given the option to select which elections they want to get recommendations for or all can be automatically included
- Multiple election rounds
- Different constituency groups for elections
- Hierarchical constituencies, e.g. regions containing municipalities
  - When users select their constituency, the hierarchies are used to automatically select parent constituencies

## Statements or Questions

- Support for separate info and opinion questions
  - Opinion questions are used in calculating the matches
  - Info questions are shown in candidate or party profiles and can be used for filtering
- Opinion question types
  - Ordinal questions, e.g. Likert with full configurability (number of options and their labels)
  - Categorical questions
  - Preference order (TBA)
  - Number (TBA)
- Info question types
  - Text
  - Number
  - Boolean
  - Categorical
  - Categorical with multiple selections
  - Date
  - Website link
  - Multiple-item text (TBA)
  - Image (partial support)
- Candidate portrait or Party logo
- Question categories
- Arbitrary ordering
- Questions or question categories that are specific to an election, constituency or type of entity
- Entities’ answers to question can be supplemented by a (translatable) open answer
- Background information for questions
  - Rich text
  - Can be separated into multiple sections
  - Video content
  - Term definitions (WIP)
  - AI-generated information (WIP)

## Entities

- Candidates
- Parties, i.e., Organizations
- Electoral Alliances
- Party Factions (partial support), e.g. those in _ley de lemas_ systems

## Matching algorithm

- Separated in an independent module
- Based on a generic mathematical model (multidimensional space) and fully extensible within its confines
- Distance calculation methods:
  - Manhattan
  - Directional
  - Euclidean
- Sub-category matching, e.g., by Question category
- Configurable method for imputing missing answers

## Candidate application

- Full application for candidates with which they can enter their data and opinions
- Support for multi-lingual input
- Optional support for self-registration using bank authentication

## Feedback and analytics

- Built-in feedback form
- Configurable user survey prompt for research purposes
- Support for Umami analytics with or without detailed events
  - User consent is asked if detailed events are tracked
