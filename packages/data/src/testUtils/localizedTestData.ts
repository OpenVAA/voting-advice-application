import {
  CandidateData,
  type ChoiceQuestionData,
  ConstituencyData,
  ElectionData,
  ENTITY_TYPE,
  LocalizedObject,
  PublicAllianceNominationData,
  QUESTION_TYPE
} from '../internal';

/**
 * The locale into which `TRANSLATED_TEST_DATA` is translated.
 */
export const TRANSLATED_TEST_DATA_LOCALE = 'en';

/**
 * Test data containing strings localized to `en` and `fi`.
 * NB. The data is not valid for actual use.
 */
const LOCALIZED_TEST_DATA: {
  [K in keyof typeof TRANSLATED_TEST_DATA]: LocalizedObject<(typeof TRANSLATED_TEST_DATA)[K]>;
} = {
  election: {
    id: 'election-1',
    name: {
      __translations__: {
        en: 'Election',
        fi: 'FI Election'
      }
    },
    shortName: {
      __translations__: {
        en: 'E2023',
        fi: 'FI E2023'
      }
    },
    info: {
      __translations__: {
        en: 'Info text',
        fi: 'FI Info text'
      }
    },
    date: '2033-11-03',
    constituencyGroupIds: ['constituencyGroup-1', 'constituencyGroup-2'],
    subtype: {
      __translations__: {
        en: 'parliamentary',
        fi: 'FI parliamentary'
      }
    }
  },
  constituency: {
    id: 'constituency-1',
    name: {
      __translations__: {
        en: 'Constituency',
        fi: 'FI Constituency'
      }
    },
    keywords: [
      {
        __translations__: {
          en: 'keyword1',
          fi: 'FI keyword1'
        }
      },
      {
        __translations__: {
          en: 'keyword2',
          fi: 'FI keyword2'
        }
      }
    ]
  },
  question: {
    id: 'question-1',
    type: QUESTION_TYPE.SingleChoiceOrdinal,
    categoryId: 'questionCategory-1',
    name: {
      __translations__: {
        en: 'Question text',
        fi: 'FI Question text'
      }
    },
    choices: [
      {
        id: 'choice-1',
        label: {
          __translations__: {
            en: 'Label 1',
            fi: 'FI Label 1'
          }
        },
        normalizableValue: 1
      },
      {
        id: 'choice-2',
        label: {
          __translations__: {
            en: 'Label 2',
            fi: 'FI Label 2'
          }
        },
        normalizableValue: 2
      },
      {
        id: 'choice-3',
        label: {
          __translations__: {
            en: 'Label 3',
            fi: 'FI Label 3'
          }
        },
        normalizableValue: 3
      }
    ]
  },
  candidate: {
    type: ENTITY_TYPE.Candidate,
    id: 'candidate-1',
    firstName: {
      __translations__: {
        en: 'Firstname',
        fi: 'FI Firstname'
      }
    },
    lastName: {
      __translations__: {
        en: 'Lastname',
        fi: 'FI Lastname'
      }
    },
    organizationId: 'organization-1',
    answers: {
      'question-1': {
        value: {
          __translations__: {
            en: 'Text value',
            fi: 'FI Text value'
          }
        }
      },
      'question-2': {
        value: 7
      },
      'question-3': {
        value: true
      },
      'question-4': {
        value: '1777-06-12'
      },
      'question-5': {
        value: {
          url: {
            __translations__: {
              en: 'https://example.com/image.jpg',
              fi: 'FI https://example.com/image.jpg'
            }
          },
          alt: {
            __translations__: {
              en: 'Alt text',
              fi: 'FI Alt text'
            }
          }
        }
      },
      'question-7a': {
        value: ['choice-1']
      },
      'question-8': {
        value: 'choice-1',
        info: {
          __translations__: {
            en: 'Open answer',
            fi: 'FI Open answer'
          }
        }
      }
    }
  },
  nomination: {
    entityType: ENTITY_TYPE.Alliance,
    entityId: 'alliance-1',
    electionId: 'election-1',
    constituencyId: 'constituency-1',
    organizations: [
      {
        entityId: 'organization-1',
        factions: [
          {
            entityId: 'faction-1',
            candidates: [
              {
                entityId: 'candidate-3'
              },
              {
                entityId: 'candidate-4'
              }
            ],
            info: {
              __translations__: {
                en: 'Info text',
                fi: 'FI Info text'
              }
            }
          }
        ]
      },
      {
        entityId: 'organization-2'
      }
    ]
  }
} as const;

/**
 * Localized test data translated to `en`.
 * NB. The data is not valid for actual use.
 */
const TRANSLATED_TEST_DATA: {
  election: ElectionData;
  constituency: ConstituencyData;
  question: ChoiceQuestionData<typeof QUESTION_TYPE.SingleChoiceOrdinal, number>;
  candidate: CandidateData;
  nomination: PublicAllianceNominationData;
} = {
  election: {
    id: 'election-1',
    name: 'Election',
    shortName: 'E2023',
    info: 'Info text',
    date: '2033-11-03',
    constituencyGroupIds: ['constituencyGroup-1', 'constituencyGroup-2'],
    subtype: 'parliamentary'
  },
  constituency: {
    id: 'constituency-1',
    name: 'Constituency',
    keywords: ['keyword1', 'keyword2']
  },
  question: {
    id: 'question-1',
    type: QUESTION_TYPE.SingleChoiceOrdinal,
    categoryId: 'questionCategory-1',
    name: 'Question text',
    choices: [
      {
        id: 'choice-1',
        label: 'Label 1',
        normalizableValue: 1
      },
      {
        id: 'choice-2',
        label: 'Label 2',
        normalizableValue: 2
      },
      {
        id: 'choice-3',
        label: 'Label 3',
        normalizableValue: 3
      }
    ]
  },
  candidate: {
    type: ENTITY_TYPE.Candidate,
    id: 'candidate-1',
    firstName: 'Firstname',
    lastName: 'Lastname',
    organizationId: 'organization-1',
    answers: {
      'question-1': {
        value: 'Text value'
      },
      'question-2': {
        value: 7
      },
      'question-3': {
        value: true
      },
      'question-4': {
        value: '1777-06-12'
      },
      'question-5': {
        value: {
          url: 'https://example.com/image.jpg',
          alt: 'Alt text'
        }
      },
      'question-7a': {
        value: ['choice-1']
      },
      'question-8': {
        value: 'choice-1',
        info: 'Open answer'
      }
    }
  },
  nomination: {
    entityType: ENTITY_TYPE.Alliance,
    entityId: 'alliance-1',
    electionId: 'election-1',
    constituencyId: 'constituency-1',
    organizations: [
      {
        entityId: 'organization-1',
        factions: [
          {
            entityId: 'faction-1',
            candidates: [
              {
                entityId: 'candidate-3'
              },
              {
                entityId: 'candidate-4'
              }
            ],
            info: 'Info text'
          }
        ]
      },
      {
        entityId: 'organization-2'
      }
    ]
  }
} as const;

/**
 * Use this function to get a deep copy of the localized test data so that any changes made to the copy won't affect other tests.
 * @returns A deep copy of `LOCALIZED_TEST_DATA`.
 */
export function getLocalizedTestData(): typeof LOCALIZED_TEST_DATA {
  return structuredClone(LOCALIZED_TEST_DATA);
}

/**
 * Use this function to get a deep copy of the translated test data so that any changes made to the copy won't affect other tests.
 * @returns A deep copy of `TRANSLATED_TEST_DATA`.
 */
export function getTranslatedTestData(): typeof TRANSLATED_TEST_DATA {
  return structuredClone(TRANSLATED_TEST_DATA);
}
