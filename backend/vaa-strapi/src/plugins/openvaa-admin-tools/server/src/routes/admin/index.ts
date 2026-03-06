import addCandidate from './addCandidate';
import candidateAuth from './candidateAuth';
import candidateStats from './candidateStats';
import data from './data';
import email from './email';

export default {
  type: 'admin',
  routes: [...addCandidate, ...candidateAuth, ...candidateStats, ...data, ...email],
};
