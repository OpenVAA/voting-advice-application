export class MockQuestion implements QuestionProps {
  constructor(
    public id: string,
    public text = 'X',
    public shortName = 'X',
    public type: QuestionProps['type'] = 'singleChoiceOrdinal',
    public values = makeLabels(),
    public entityType: QuestionProps['entityType'] = 'candidate',
    public category = new MockQuestionCategory('c1')
  ) {}
}

export class MockQuestionCategory implements QuestionCategoryProps {
  constructor(
    public id: string,
    public name = 'X',
    public shortName = 'X',
    public type: QuestionCategoryProps['type'] = 'opinion',
    public order = 0,
    public questions = new Array<QuestionProps>()
  ) {}
}

export class MockParty implements PartyProps {
  constructor(
    public id: string,
    public answers: AnswerDict = {},
    public info = 'X',
    public name = 'X',
    public shortName = 'X'
  ) {}
}

export class MockCandidate implements CandidateProps {
  constructor(
    public id: string,
    public party: PartyProps,
    public answers: AnswerDict = {},
    public firstName = 'X',
    public lastName = 'X',
    public name = 'X'
  ) {}
}

export function makeLabels(count = 4) {
  const labels: Array<AnswerOption> = [];
  for (let i = 1; i < count + 1; i++) {
    labels.push({
      key: i,
      label: `Label ${i}}`
    });
  }
  return labels;
}
