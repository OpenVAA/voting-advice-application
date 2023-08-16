import {type Question, type Person, type PersonNomination, TemplateQuestion} from '$lib/vaa-data';

/**
 * Display a Person's answer nicely depending on Question type.
 * @param question The Question object
 * @param person The Person object
 * @param noAnswer The string to output if there's no answer
 */
export function displayAnswer(
  question: Question,
  person: Person | PersonNomination,
  noAnswer = '<em>no answer</em>'
) {
  const answer = person.getAnswer(question);
  if (answer == null || answer.value === '') {
    return noAnswer;
  }
  const info = answer.info ? ` (”${answer.info}”)` : '';
  if (question instanceof TemplateQuestion && typeof answer === 'number') {
    return question.getValueLabel(answer) + info;
  }
  return answer.value + info;
}
