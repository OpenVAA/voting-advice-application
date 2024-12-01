export class MockQuestion implements LegacyQuestionProps {
  constructor(
    public id: string,
    public text = 'X',
    public shortName = 'X',
    public type: LegacyQuestionProps['type'] = 'singleChoiceOrdinal',
    public values = makeLabels(),
    public entityType: LegacyQuestionProps['entityType'] = 'candidate',
    public category = new MockQuestionCategory('c1')
  ) {}
}

export class MockQuestionCategory implements LegacyQuestionCategoryProps {
  constructor(
    public id: string,
    public name = 'X',
    public shortName = 'X',
    public type: LegacyQuestionCategoryProps['type'] = 'opinion',
    public order = 0,
    public questions = new Array<LegacyQuestionProps>()
  ) {}
}

export class MockParty implements LegacyPartyProps {
  constructor(
    public id: string,
    public answers: LegacyAnswerDict = {},
    public info = 'X',
    public name = 'X',
    public shortName = 'X'
  ) {}
}

export class MockCandidate implements LegacyCandidateProps {
  constructor(
    public id: string,
    public party: LegacyPartyProps,
    public answers: LegacyAnswerDict = {},
    public firstName = 'X',
    public lastName = 'X',
    public name = 'X'
  ) {}
}

export function makeLabels(count = 4) {
  const labels: Array<LegacyAnswerOption> = [];
  for (let i = 1; i < count + 1; i++) {
    labels.push({
      key: i,
      label: `Label ${i}}`
    });
  }
  return labels;
}
