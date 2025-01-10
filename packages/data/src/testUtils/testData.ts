import {
  Choice,
  ENTITY_TYPE,
  EntityType,
  EntityVariantTree,
  type FullVaaData,
  Id,
  NominationVariantTree,
  QUESTION_CATEGORY_TYPE,
  QUESTION_TYPE
} from '../internal';

export const LIKERT_5_CHOICES: Array<Choice<number>> = [
  {
    id: '1',
    label: 'Strongly disagree',
    normalizableValue: 1
  },
  {
    id: '2',
    label: 'Disagree',
    normalizableValue: 2
  },
  {
    id: '3',
    label: 'Neutral',
    normalizableValue: 3
  },
  {
    id: '4',
    label: 'Agree',
    normalizableValue: 4
  },
  {
    id: '5',
    label: 'Strongly agree',
    normalizableValue: 5
  }
] as const;

export const TEST_DATA: FullVaaData<EntityVariantTree, NominationVariantTree> = {
  elections: [
    {
      id: 'election-1',
      name: 'Hyrule Parliamentary Elections 2033',
      shortName: 'Parliamentary Elections 2033',
      info: 'The 200 member of the Hyrulian Parliament are chosen in the elections.',
      date: '2033-11-03',
      constituencyGroupIds: ['constituencyGroup-1', 'constituencyGroup-2'],
      subtype: 'parliamentary',
      multipleRounds: true
    },
    {
      id: 'election-2',
      name: 'Hyrule Municipal Elections 2033',
      shortName: 'Municipal Elections 2033',
      info: 'The municipal council members for each of the municipalities in Hyrule are chosen in the elections.',
      date: '2033-11-03',
      constituencyGroupIds: ['constituencyGroup-3'],
      subtype: 'municipal'
    }
  ],
  constituencies: {
    groups: [
      {
        id: 'constituencyGroup-1',
        name: 'Regions',
        info: 'The regions in which your municipality is located.',
        constituencyIds: ['constituency-1-1', 'constituency-1-2', 'constituency-1-3']
      },
      {
        id: 'constituencyGroup-2',
        name: 'Ethnicities',
        info: 'If you’re a member of an indigenous group, you may cast a separate vote for a representative of your group.',
        constituencyIds: ['constituency-2-1', 'constituency-2-2']
      },
      {
        id: 'constituencyGroup-3',
        name: 'Municipalities',
        info: 'The municipalities belong to Regions.',
        constituencyIds: [
          // In Region 1
          'constituency-3-1',
          'constituency-3-2',
          'constituency-3-3',
          // In Region 2
          'constituency-3-4',
          'constituency-3-5',
          'constituency-3-6',
          'constituency-3-7',
          // In Region 3
          'constituency-3-8',
          'constituency-3-9'
        ]
      }
    ],
    constituencies: [
      {
        id: 'constituency-1-1',
        name: 'Central Hyrule'
      },
      {
        id: 'constituency-1-2',
        name: 'Lanayru'
      },
      {
        id: 'constituency-1-3',
        name: 'Gerudo Desert'
      },
      {
        id: 'constituency-2-1',
        name: 'Moblin'
      },
      {
        id: 'constituency-2-2',
        name: 'Korok'
      },
      {
        id: 'constituency-3-1',
        name: 'Hyrule Castle',
        parentId: 'constituency-1-1'
      },
      {
        id: 'constituency-3-2',
        name: 'Great Hyrule Forest',
        parentId: 'constituency-1-1'
      },
      {
        id: 'constituency-3-3',
        name: 'Lake Hylia',
        parentId: 'constituency-1-1'
      },
      {
        id: 'constituency-3-4',
        name: 'Zora’s Domain',
        parentId: 'constituency-1-2'
      },
      {
        id: 'constituency-3-5',
        name: 'Rutala',
        parentId: 'constituency-1-2'
      },
      {
        id: 'constituency-3-6',
        name: 'Lanyuru Wetlands',
        parentId: 'constituency-1-2'
      },
      {
        id: 'constituency-3-7',
        name: 'Kakariko Village',
        parentId: 'constituency-1-2'
      },
      {
        id: 'constituency-3-8',
        name: 'Gerudo Town',
        parentId: 'constituency-1-3'
      },
      {
        id: 'constituency-3-9',
        name: 'Gerudo Canyon',
        parentId: 'constituency-1-3'
      }
    ]
  },
  questions: {
    categories: [
      {
        id: 'questionCategory-1',
        name: 'Basic Information',
        info: 'The candidates’s basic information, such as occupation.',
        type: QUESTION_CATEGORY_TYPE.Info
      },
      {
        id: 'questionCategory-2',
        name: 'Party Information',
        info: 'The parties’ basic information.',
        entityType: [ENTITY_TYPE.Organization],
        type: QUESTION_CATEGORY_TYPE.Info
      },
      {
        id: 'questionCategory-3',
        name: 'Infrastructure',
        info: 'Political statements concerning building and maintaining infrastructure.',
        type: QUESTION_CATEGORY_TYPE.Opinion,
        color: {
          normal: '#FF6666',
          dark: '#FFAAAA'
        }
      },
      {
        id: 'questionCategory-4',
        name: 'Economy',
        info: 'Political statements concerning the economy.',
        type: QUESTION_CATEGORY_TYPE.Opinion,
        color: {
          normal: '#6666FF',
          dark: '#AAAAFF'
        }
      }
    ],
    questions: [
      {
        id: 'question-1',
        type: QUESTION_TYPE.Text,
        categoryId: 'questionCategory-1',
        name: 'Manifesto',
        info: 'The election manifesto.'
      },
      {
        id: 'question-2',
        type: QUESTION_TYPE.Number,
        categoryId: 'questionCategory-1',
        name: 'Lucky number',
        info: 'The lucky number.'
      },
      {
        id: 'question-3',
        type: QUESTION_TYPE.Boolean,
        categoryId: 'questionCategory-1',
        name: 'Pointy ears',
        info: 'Whether the candidate has pointy ears or not. Only applicable to candidates.',
        entityType: [ENTITY_TYPE.Candidate]
      },
      {
        id: 'question-4',
        type: QUESTION_TYPE.Date,
        categoryId: 'questionCategory-1',
        name: 'Birthdate',
        info: 'The candidate’s date of birth. Only applicable to candidates.',
        entityType: [ENTITY_TYPE.Candidate],
        min: '100-01-01',
        max: '2050-01-01'
      },
      {
        id: 'question-5',
        type: QUESTION_TYPE.Image,
        categoryId: 'questionCategory-1',
        name: 'Favourite travel photo',
        info: 'A photo from the candidate’s travels. Only applicable to candidates.',
        entityType: [ENTITY_TYPE.Candidate]
      },
      {
        id: 'question-6',
        type: QUESTION_TYPE.Boolean,
        categoryId: 'questionCategory-2',
        name: 'Currently in government',
        info: 'Whether the party is currently in the government or not.'
      },
      {
        id: 'question-7',
        type: QUESTION_TYPE.MultipleText,
        categoryId: 'questionCategory-2',
        name: 'Themes',
        info: 'The most important political themes of the party. Only applicable to organizations via the question category.'
      },
      {
        id: 'question-7a',
        type: QUESTION_TYPE.MultipleChoiceCategorical,
        categoryId: 'questionCategory-2',
        name: 'Languages',
        info: 'Select the languages you can speak.',
        entityType: ENTITY_TYPE.Candidate,
        choices: [
          {
            id: 'choice-1',
            label: 'Hylian'
          },
          {
            id: 'choice-2',
            label: 'Zora'
          },
          {
            id: 'choice-3',
            label: 'Gerudo'
          },
          {
            id: 'choice-4',
            label: 'Korok'
          },
          {
            id: 'choice-5',
            label: 'Goron'
          }
        ]
      },
      {
        id: 'question-8',
        type: QUESTION_TYPE.SingleChoiceCategorical,
        categoryId: 'questionCategory-3',
        name: 'Which region should the new Hyrule Castle be built in?',
        info: 'Select the region where the new Hyrule Castle should be built. Applies only to the municipal elections.',
        electionIds: ['election-2'],
        choices: [
          {
            id: 'choice-1',
            label: 'Akkala'
          },
          {
            id: 'choice-2',
            label: 'Hebra'
          },
          {
            id: 'choice-3',
            label: 'Faron'
          }
        ]
      },
      {
        id: 'question-9',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        categoryId: 'questionCategory-3',
        name: 'When building new roads, travel on horseback should be preferred to Zonai vehicles.',
        info: 'Select a choice which best describes how well you agree or disagree with this statement.',
        choices: LIKERT_5_CHOICES
      },
      {
        id: 'question-10',
        type: QUESTION_TYPE.Number,
        categoryId: 'questionCategory-3',
        name: 'How many stables should there be in the Central Hyrule area?',
        info: 'Select the region where the new Hyrule Castle should be built. Applies only to the municipal elections and the Central Hyrule constituency.',
        electionIds: ['election-2'],
        constituencyIds: ['constituency-1-1'],
        min: 0,
        max: 10
      },
      {
        id: 'question-11',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        categoryId: 'questionCategory-4',
        name: 'The taxes levied on discoveries of Zonai artifacts should be decreased.',
        info: 'Select a choice which best describes how well you agree or disagree with this statement.',
        choices: LIKERT_5_CHOICES
      },
      {
        id: 'question-12',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        categoryId: 'questionCategory-4',
        name: 'The building of mines on sky islands should be allowed.',
        info: 'Select a choice which best describes how well you agree or disagree with this statement.',
        choices: LIKERT_5_CHOICES
      },
      {
        id: 'question-13',
        type: QUESTION_TYPE.SingleChoiceOrdinal,
        categoryId: 'questionCategory-4',
        name: 'The consumption tax rates should be harmonized across all Hyrule regions.',
        info: 'Select a choice which best describes how well you agree or disagree with this statement.',
        choices: LIKERT_5_CHOICES
      }
    ]
  },
  entities: {
    alliance: [
      {
        id: 'alliance-1',
        name: 'United Independence Front',
        shortName: 'UIF',
        info: 'An explicit Alliance alhough in most circumstances we would use an implicit one, defined solely with the AllianceNomination.',
        answers: {
          'question-1': {
            value: 'The United Independence Front does not dictate it’s member parties’ policies.'
          }
        }
      }
    ],
    candidate: [
      {
        id: 'candidate-1',
        firstName: 'Ganon',
        lastName: 'Dorf',
        organizationId: 'organization-1',
        answers: {
          'question-1': {
            value: 'If I’m elected I pledge to destroy the new Hyrule Castle and usher in a reign of evil!'
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
              url: 'https://example.com/underworld.jpg',
              alt: 'Ganon Dorf exploring the underworld.'
            }
          },
          'question-7a': {
            value: ['choice-1']
          },
          'question-8': {
            value: 'choice-1',
            info: 'The location of the castle does not really matter, as I will destroy it anyway.'
          },
          'question-9': {
            value: '5',
            info: 'Zonai vehicles should be banned.'
          },
          'question-10': {
            value: 5,
            info: 'The number of stables does not really matter, as I will destroy them anyway.'
          },
          'question-11': {
            value: '5'
          },
          'question-12': {
            value: '5'
          },
          'question-13': {
            value: '3',
            info: 'This depends on whether the lowest or highest current rate would be made nationwide.'
          }
        }
      },
      {
        id: 'candidate-2',
        firstName: 'Mobba',
        lastName: 'Moblin',
        organizationId: 'organization-1',
        answers: {
          'question-1': {
            value: 'My main focus will be on improving the rights of moblins and other nomadic tribes.'
          },
          'question-2': {
            value: 4
          },
          'question-4': {
            value: '2003-03-01'
          },
          'question-5': undefined,
          'question-7a': {
            value: ['choice-1']
          },
          'question-8': {
            value: 'choice-2'
          },
          'question-9': {
            value: '3',
            info: 'Horses and Zonai vehicles should be treated equally.'
          },
          'question-10': {
            value: 8
          },
          'question-11': {
            value: '4'
          },
          'question-12': {
            value: '4'
          },
          'question-13': {
            value: '2'
          }
        }
      },
      {
        id: 'candidate-3',
        firstName: 'Urbosa',
        lastName: 'Ugula',
        organizationId: 'organization-2',
        answers: {
          'question-1': {
            value: 'The Gerudo desert irrigation project must be started within the next three years.'
          },
          'question-2': {
            value: 5
          },
          'question-4': {
            value: '2002-01-05'
          },
          'question-5': undefined,
          'question-7a': {
            value: ['choice-1', 'choice-3']
          },
          'question-8': {
            value: 'choice-3'
          },
          'question-9': {
            value: '2'
          },
          'question-10': {
            value: 15
          },
          'question-11': {
            value: '3'
          },
          'question-12': {
            value: '1'
          },
          'question-13': {
            value: '4'
          }
        }
      },
      {
        id: 'candidate-4',
        firstName: 'Riju',
        lastName: 'Makeesa',
        organizationId: 'organization-2',
        answers: {
          'question-1': {
            value: 'All tribes and races of Hyrule should leave in peaceful harmony.'
          },
          'question-2': {
            value: 99
          },
          'question-4': {
            value: '2016-10-10'
          },
          'question-7a': {
            value: ['choice-1', 'choice-3', 'choice-5']
          },
          'question-8': {
            value: 'choice-1'
          },
          'question-9': {
            value: '3'
          },
          'question-10': {
            value: 12
          },
          'question-11': {
            value: '2'
          },
          'question-12': {
            value: '2'
          },
          'question-13': {
            value: '5'
          }
        }
      },
      {
        id: 'candidate-5',
        firstName: 'Toto',
        lastName: 'Zora',
        organizationId: 'organization-3',
        answers: {
          'question-1': {
            value: 'Water management issues are the most critical for the future of Hyrule.'
          },
          'question-2': {
            value: 6
          },
          'question-4': {
            value: '1975-11-03'
          },
          'question-7a': {
            value: ['choice-1', 'choice-2']
          },
          'question-8': {
            value: 'choice-2'
          },
          'question-9': {
            value: '1'
          },
          'question-10': {
            value: 0
          },
          'question-11': {
            value: '3'
          },
          'question-12': {
            value: '2'
          },
          'question-13': {
            value: '5'
          }
        }
      },
      {
        id: 'candidate-6',
        firstName: 'Mipha',
        lastName: 'Zora',
        organizationId: 'organization-3',
        answers: {
          'question-1': {
            value: 'The overfishing in rivers must be stopped immediately.'
          },
          'question-2': {
            value: 0
          },
          'question-4': {
            value: '2001-03-26'
          },
          'question-7a': {
            value: ['choice-1', 'choice-2', 'choice-3']
          },
          'question-8': {
            value: 'choice-2'
          },
          'question-9': {
            value: '3'
          },
          'question-10': {
            value: 0
          },
          'question-11': {
            value: '1'
          },
          'question-12': {
            value: '3'
          },
          'question-13': {
            value: '4'
          }
        }
      },
      {
        id: 'candidate-7',
        firstName: 'Laruto',
        lastName: 'Zora',
        // Independent candidate, i.e., no organizationId
        answers: {
          'question-1': {
            value: 'Hyrulians should respect more the teachings of the sages of yore.'
          },
          'question-2': {
            value: 0
          },
          'question-4': {
            value: '1931-10-28'
          },
          'question-7a': {
            value: ['choice-1', 'choice-2']
          },
          'question-8': {
            value: 'choice-2'
          },
          'question-9': {
            value: '3'
          },
          'question-10': {
            value: 5
          },
          'question-11': {
            value: '3'
          },
          'question-12': {
            value: '3'
          },
          'question-13': {
            value: '3'
          }
        }
      },
      {
        id: 'candidate-8',
        firstName: 'Hollo',
        lastName: 'Hollo',
        organizationId: 'organization-4',
        answers: {
          'question-1': {
            value: 'The administration of Hyrules woodlands should be devolved to the Korok.'
          },
          'question-2': {
            value: 9
          },
          'question-4': {
            value: '2005-07-18'
          },
          'question-7a': {
            value: ['choice-1', 'choice-4']
          },
          'question-8': {
            value: 'choice-3'
          },
          'question-9': {
            value: '1'
          },
          'question-10': {
            value: 10
          },
          'question-11': {
            value: '4'
          },
          'question-12': {
            value: '5'
          },
          'question-13': {
            value: '4'
          }
        }
      }
    ],
    faction: [
      {
        id: 'faction-1',
        name: 'The Conservative Gerudo Faction',
        info: 'An explicit Faction alhough in most circumstances we would use an implicit one, defined solely within the OrganizationNomination containing the Faction.',
        answers: {
          'question-1': {
            value:
              'The Conservative Gerudo Faction does not allow members from outside the Constitutional Gerudo Party.'
          },
          'question-6': {
            value: true
          }
        }
      }
    ],
    organization: [
      {
        id: 'organization-1',
        name: 'The Evil Party',
        shortName: 'EP',
        image: {
          url: 'https://example.com/the-evil-party-logo.png',
          urlDark: 'https://example.com/the-evil-party-logo-negative.png',
          alt: 'Logo of the Evil Party'
        },
        answers: {
          'question-1': {
            value: 'The Evil Party opposes any developments for the common good and promotes evil in all its forms.'
          },
          'question-6': {
            value: false
          }
        }
      },
      {
        id: 'organization-2',
        name: 'Constitutional Gerudo Party',
        shortName: 'CGP',
        answers: {
          'question-1': {
            value:
              'The Gerudo party seeks partial autonomy for the Gerudo region and the abolition of Zonai artifact taxes.'
          },
          'question-6': {
            value: true
          },
          'question-11': {
            value: '1',
            info: 'Discovery of Zonai artifacts should not be taxed at all because they are not the government’s property.'
          }
        }
      },
      {
        id: 'organization-3',
        name: 'The Royal United Zora Movement',
        shortName: 'RUZ',
        answers: {
          'question-1': {
            value:
              'The Hyrulian Crown is the birthright of the Zora with only a limited decree of autonomy for the regions.'
          },
          'question-6': {
            value: false
          },
          'question-11': {
            value: '1'
          },
          'question-12': {
            value: '1'
          },
          'question-13': {
            value: '5'
          }
        }
      },
      {
        id: 'organization-4',
        name: 'The Deku Conservation League',
        shortName: 'Deku',
        answers: {
          'question-1': {
            value: 'The forest of Hyrule should be governed by the Korok residing in them.'
          },
          'question-6': {
            value: false
          },
          'question-9': {
            value: '5',
            info: 'Zonai vehicles pollute the air and water.'
          }
        }
      }
    ]
  },
  nominations: {
    'election-1': {
      'constituency-1-1': [
        {
          entityType: ENTITY_TYPE.Alliance,
          entityId: 'alliance-1',
          organizations: [
            {
              entityId: 'organization-1',
              info: 'A closed list'
            },
            {
              entityId: 'organization-2',
              info: 'A closed list'
            }
          ],
          info: 'An AllianceNomination linking to an explicit Alliance entity.'
        }
      ],
      'constituency-1-2': [
        {
          entityType: ENTITY_TYPE.Alliance,
          name: 'The United Zora-Gerudo Front',
          organizations: [
            {
              entityId: 'organization-2',
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
                  info: 'A FactionNomination with an explicit Faction entity.'
                },
                {
                  candidates: [
                    {
                      entityId: 'candidate-5',
                      info: 'Nomination of a candidate from a different party'
                    },
                    {
                      entityId: 'candidate-7',
                      info: 'Nomination of an independent candidate'
                    }
                  ],
                  name: 'External Faction',
                  info: 'A FactionNomination with candidates not belonging to this party.'
                }
              ]
            },
            {
              entityId: 'organization-3',
              candidates: [
                {
                  entityId: 'candidate-5',
                  info: 'Nomination of the same candidate but by another party'
                },
                {
                  entityId: 'candidate-6'
                }
              ]
            }
          ],
          info: 'A regular AllianceNomination with an implicit Alliance entity, full hierarchy of nominations and an overriden name in the Nomination data.'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          electionRound: 2,
          candidates: [
            {
              entityId: 'candidate-5',
              info: 'Nomination of a candidate from a different party'
            },
            {
              entityId: 'candidate-7',
              info: 'Nomination of an independent candidate'
            }
          ],
          info: 'A nomination on the second round of elections. NB. This is a bit silly, because there are no other nominations for the second round.'
        }
      ],
      'constituency-1-3': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          candidates: [
            {
              entityId: 'candidate-3'
            }
          ]
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-4',
          candidates: [
            {
              entityId: 'candidate-8'
            }
          ]
        }
      ],
      'constituency-2-1': [
        {
          entityType: ENTITY_TYPE.Candidate,
          entityId: 'candidate-2',
          info: 'A candidate nomination without a nominating organization.'
        }
      ],
      'constituency-2-2': [
        {
          entityType: ENTITY_TYPE.Candidate,
          entityId: 'candidate-8',
          info: 'A candidate nomination without a nominating organization.'
        }
      ]
    },
    'election-2': {
      'constituency-3-1': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ],
      'constituency-3-2': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-4',
          info: 'Closed list'
        }
      ],
      'constituency-3-3': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ],
      'constituency-3-4': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ],
      'constituency-3-5': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ],
      'constituency-3-6': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ],
      'constituency-3-7': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ],
      'constituency-3-8': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ],
      'constituency-3-9': [
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-1',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-2',
          info: 'Closed list'
        },
        {
          entityType: ENTITY_TYPE.Organization,
          entityId: 'organization-3',
          info: 'Closed list'
        }
      ]
    }
  }
} as const;

/**
 * Nomination counts for all rounds for each entity.
 */
export const ENTITY_NOMINATIONS: Record<EntityType, Record<Id, number>> = {
  alliance: {
    'alliance-1': 1
  },
  candidate: {
    'candidate-1': 0,
    'candidate-2': 1,
    'candidate-3': 2,
    'candidate-4': 1,
    'candidate-5': 3,
    'candidate-6': 1,
    'candidate-7': 2,
    'candidate-8': 2
  },
  faction: {
    'faction-1': 1
  },
  organization: {
    'organization-1': 10,
    'organization-2': 13,
    'organization-3': 10,
    'organization-4': 2,
    'organization-5': 0
  }
} as const;

/**
 * Nomination counts for round 1 in the test data.
 */
export const NOMINATION_COUNTS = {
  'election-1': {
    'constituency-1-1': {
      alliance: 1,
      organization: 2,
      faction: 0,
      candidate: 0
    },
    'constituency-1-2': {
      alliance: 1,
      organization: 2,
      faction: 2,
      candidate: 6 // NB. 'candidate-5' is nominated twice in this constituency
    },
    'constituency-1-3': {
      alliance: 0,
      organization: 2,
      faction: 0,
      candidate: 2
    },
    'constituency-2-1': {
      alliance: 0,
      organization: 0,
      faction: 0,
      candidate: 1
    },
    'constituency-2-2': {
      alliance: 0,
      organization: 0,
      faction: 0,
      candidate: 1
    }
  },
  'election-2': {
    'constituency-3-1': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    },
    'constituency-3-2': {
      alliance: 0,
      organization: 4,
      faction: 0,
      candidate: 0
    },
    'constituency-3-3': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    },
    'constituency-3-4': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    },
    'constituency-3-5': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    },
    'constituency-3-6': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    },
    'constituency-3-7': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    },
    'constituency-3-8': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    },
    'constituency-3-9': {
      alliance: 0,
      organization: 3,
      faction: 0,
      candidate: 0
    }
  }
} as const;

/**
 * Nomination counts for round 2 in the test data.
 */
export const NOMINATION_COUNTS_ROUND_2 = {
  'election-1': {
    'constituency-1-2': {
      alliance: 0,
      organization: 1,
      faction: 0,
      candidate: 2
    }
  }
} as const;
