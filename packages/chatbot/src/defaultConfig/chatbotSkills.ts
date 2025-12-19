/** What the chatbot thinks it can do. These should reflect the tools and data it has access to.
 * Ideally, these would be dynamic according to data, but that is impossible, because the it depends
 * on the data we have saved in the vector store in addition to tools which provide detailed information
 * about what kind of data or functionality they can provide. 
 */
export const CHATBOT_SKILLS = [
  'find information about the 2024 EU elections',
  'find information about parties in the 2024 EU elections (including which parties are running)',
  'explain party histories and policies',
  'help understand election theory and importance',
  'help understand the European Union and how its subsystems work',
  'turn vague interests into concrete questions and propose next step topics when the user is unsure.',
  'engage in conversation with the user about their feelings and emotions without a direct relation to the elections',
  'answer other EU related general questions',
  'answer election statistics questions',
  'find general voter count'
]

/** Define default topics that can be used if user is unsure about what to talk about. */
export const FALLBACK_TOPICS = [
  'Why your vote matters',
  'Different political topics like immigration, climate change, etc.',
  'different parts of the EU and how they work together',
  'EU politics and history',
  'election statistics like number of people to be elected'
]