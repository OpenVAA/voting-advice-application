import { DataRoot, ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '../src/internal';
import { getTestData } from '../src/testUtils';

const root = new DataRoot({ data: getTestData() });

// Show elections
console.info('Select an election');
// NB. We use ! to assert the existence of the collections because we provided the full data on creation of root
for (const e of root.elections!) console.info(`- ${e}`);

// Assume the user picked election-1
const election = root.getElection('election-1');
console.info(`Selected election: ${election.shortName}`);

// Show the constituency groups and their constituencies for the selected election
console.info('Select your constituency');
for (const cg of election.constituencyGroups) {
  console.info(`- ${cg}`);
  for (const c of cg.constituencies) console.info(`  - ${c}`);
}

// Assume the user picked constituency-1-2
const constituency = root.getConstituency('constituency-1-2');
console.info(`Selected constituency: ${constituency.shortName}`);

// Show the question categories applicable for the selected election and constituency
console.info('Select the question categories you want to answer');
const filters = { elections: election, constituencies: constituency };
for (const qc of root.questionCategories!.filter(
  (qc) => qc.type !== QUESTION_CATEGORY_TYPE.Info && qc.appliesTo(filters)
))
  console.info(`- ${qc}`);

// Assume the user picked questionCategory-1 and questionCategory-2
const questionCategories = ['questionCategory-2', 'questionCategory-3'].map((id) => root.getQuestionCategory(id));
console.info(`Selected categories: ${questionCategories.map((qc) => qc.shortName).join(' • ')}`);

// Show the questions in the selected question categories and filtered by election and constituency
for (const qc of questionCategories) {
  console.info(`Questions in category ${qc.name}`);
  for (const q of qc.questions!.filter((q) => q.appliesTo(filters))) console.info(`- ${q.name}`);
}

// Get the nominations for the selected election in the selected constituency
// NB. We could pass the nominations to the matching algorith before showing them
console.info(`Nominations for ${election.name} in constituency ${constituency.name}`);

console.info('Organizations:');
for (const on of election.getOrganizationNominations(constituency)) {
  let text = `- ${on.entity.name}`;
  if (on.electionSymbol) text += ` (${on.electionSymbol})`;
  if (on.allianceNomination) text += ` • in the alliance ${on.allianceNomination.name}`;
  if (on.candidateNominations.length) text += ` • listing ${on.candidateNominations.length} candidates`;
  else if (on.factionNominations.length) text += ` • listing ${on.factionNominations.length} factions`;
  else text += ' • fully closed list';
  console.info(text);
}

console.info('Candidates:');
for (const cn of election.getCandidateNominations(constituency)) {
  let text = `- ${cn.entity.name}`;
  if (cn.electionSymbol) text += ` (${cn.electionSymbol})`;
  // NB. cn.list/factionList.name defaults to cn.list/factionList.entity.name
  if (cn.list) text += ` on party list ${cn.list.name}`;
  else if (cn.factionList) text += ` on faction list ${cn.factionList.name} of ${cn.factionList.list.name}`;
  else text += ' independent candidate';
  // The candidate may belong to a different organization from the one nominating them
  if (cn.entity.organization) text += ` • member of ${cn.entity.organization.name}`;
  else text += ' • not a member of any party';
  text += ` • id: ${cn.entity.id}`;
  console.info(text);
}

console.info('Select an entity to view');
// Assume the user picked candidate-3
const entityType = ENTITY_TYPE.Candidate;
const entity = root.getEntity(entityType, 'candidate-3');
console.info(`Details for ${entity.type} '${entity.name}'`);
for (const question of root.questions!.filter((q) => q.appliesTo({ ...filters, entityTypes: entityType })))
  console.info(`- ${question.name}: ${entity.getAnswer(question)?.value ?? '--'}`);
