1. Convert mock data from EU VAA to new data model
   1. New question types
   2. Pick questions
2. Convert new data from Google sheet
3. Combine data
   1. Pseudonymise candidates and parties
   2. Remove party logos
4. New question types for backend only, set flag in customData
5. Create mock-UI for questions, no effect on results

## Extra

data: question types

- extend MultipleChoiceQuestion (ordered = true)
  - PrefOrder => split into binary comparison dimensions
  - Voting
- implement:
  - normalizedDimensions?: number;
  - normalizeValue(value: unknown): CoordinateOrMissing | Array<CoordinateOrMissing>;
  - AnswerValue
  - QUESTION_TYPE: MULTIPLE_CHOICE_QUESTION_TYPE
  - later: aggregate/vote method for all matchable questions for computing party "averages"

Shows the most compatible party by percents

“These topics resonated with you the most”:
List questions in which the person answered either strongly agree or strongly disagree (like in Palumba)

“On [topic] you are more into [x or y]”

Questions are assigned to
“Human and social rights” (questions 1, 2, 6),
“Climate and economy” (3, 7),
“Global openness (4,5)”
Human and social rights (1, 2, 6, 8)
🌈 Rights Champion - agree with the questions 1, 2, 3, 6, least cuts from healthcare/social services
🤝 Traditionalist - disagree with the questions 1, 2, 3, 6
Climate and economy (3, 7, 8)
🌍 Climate Guardian - agree with 3, prioritising climate in 7
💼 Growth Advocate - disagree with 3, least cuts from economic development, prioritising employment
Global openness (4, 5, 8)
🌏 Open Borders Believer - disagree with 5, agree with 4
🛡️ Sovereignty Defender - agree with 4, disagree with 5, least cuts from defence
