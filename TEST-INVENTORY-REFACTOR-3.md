NOTES

- I changed the candidates and parties to get one party on top in the ranking

BUG IN Categorical entity filter

- The No answer option is not automatically selected when no filters are on
- It cannot be properly selected either
- Fix this
- Also, currently when no items are selected all of them are auto-selected, revert this behaviour to allow the user to select none (with 0 results)

GENERAL

- Extend the same "[ID] desc" pattern to the object names in baseV1 as in the perm specs
  - Use the same nomenclature
  - Remove TEXT_RE afterwards
- Edit the descs for question categories so that they reflect the voter action in spec:
  - Opt A "Not selected in categories intro" => id to [<id>-NotSelected]
  - Opt B "Skipped in category intro" => id to [<id>-Skipped]

CHANGE SETTINGS:

- Add a question to candidate card contents
- results: {
  cardContents: {
  candidate: ['submatches', {
  question: FETCH DB ID FOR question with ex id of 'test-qu-info-text'
  }],

FIXTURES/UTILS:

- Build fixtures for all main views so that we can use them in the perm (and other) specs too
  - Logic for selecting common elements and interacting with them (e.g. selectElection) should be in the utils, not the specs
- resultsPage
  - selectElection(/name/ | (count) => index)
  - selectEntityTab(entityType)
  - expectEntityTabs(entityType[]) (or just getEntityTabs() and assert in the spec; goes for other expects in fixtures too)
  - getEntityCards() (should get only outer cards for orgs and alliances)
  - getEntityCard(/name/ | (count) => index)
  - dismissAllDialogs()
  - openEntityDetailsForCard(/name/ | (count) => index)
- entityFilters
  - getTextFilter()
  - setTextFilter(text)
  - clearTextFilter()
  - openFilterDialog()
  - getFilterButtonBadge()
- entityFilterDialog (or bundle smartly into entityFilters)
  - getFilters()
  - getFilter(/name/ | (count) => index)
  - expectResetToBeDisabled({ disabled: true/false }?)
  - close()
  - reset()
- entityFilter (or bundle smartly into entityFilters)
  - getOptions()
  - getOption(/accessible name/ | (count) => index)
  - setSelection(/values to select/ | (count) => indeces | undef for all): for checkboxes only
  - setNumberRange(min?, max?)
- entityDetails
  - selectTab(tabType from settings)
  - expectTabs(tabType[])
  - getInfoItems()
  - expectInfoItem(/label/, /value/)
  - getQuestionDisplays()
  - expectQuestionDisplay( ... ) like the util already built
  - getMemberCards()

EDIT step: result-card-contents

- refactor to use fixtures
- card = getEntityCard(0) for candidates
  - expect that the answer to the 'test-qu-info-text' is shown
  - expect that the submatches are shown
  - expect that the submatches contain 4 score gauges
  - expect to have election symbol 10
- remove
  //Switch to parties tab and assert at least 1 organization card.
  const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
  await entityTabs.getByRole('tab', { name: TEXT_RE.partiesTab }).click();
  const partySection = page.getByTestId(testIds.voter.results.partySection);
  await expect(partySection).toBeVisible({ timeout: TIMEOUT.slowPage });
  const partyCards = partySection.getByTestId(testIds.voter.results.card);
  const partyCount = await partyCards.count();
  expect(partyCount).toBeGreaterThan(0);

ADD step: maching: organisations

- selectElection(reg)
- selectEntityTab(orgs)
- cards = getEntityCards()
  - expect cards count === 5
- card = cards.first()
  - expect card to be Party BB - Best-Regional-Party
  - expect card to contain two candidates
  - expect card to not contain a Show all x candidates button
- bigPartyCard = cards.filter({ hasText: 'Party AA' })
  - expect bigPartyCard to show 3 candidates
  - expect bigPartyCard to contain a Show all 5 candidates button
  - click the Show all 5 candidates button
  - expect bigPartyCard to now show all 5 candidates
  - expect bigPartyCard to contain a Collapse list button
  - click the Collapse list button
  - expect bigPartyCard to show 3 candidates again
  - expect bigPartyCard to contain a Show all 5 candidates button

REMOVE: detail: drawer open & detail: Polar-Max info-items

REFACTOR step: detail: 9.6.5-8 voter-vs-entity matrix on CA-AA-Special

- use fixtures
- rename "candidate details"

REFACTOR step: party-drawer: info+candidates+opinions tabs + correct filter list => organisation details

- selectElection(reg)
- selectEntityTab(orgs)
- openEntityDetailsForCard(/Party AA/) => index)
- expectTabs(info, members, opinions)
- selectTab(info)
- expectInfoItems:
  Election / Regional Election
  Constituency / Region North
  alliance / Alliance A (AL-A)
- selectTab(members)
- getMemberCards()
  - expect count 5

REMOVE:

- filters: toggle without effect_update_depth_exceeded (MOVED 9.5.5 / RESULTS-01+02)
- filters: plural tab switch reset + drawer survival + browser back (MOVED 9.5.6, 9.5.7, 9.5.10 / D-13+14+15)
- filters: SETTINGS-01 wave B Number/Text/Choice/Group/MissingValue (MOVED 9.5.14-9.5.18)

ADD step: filters: text

- selectElection(reg)
- selectEntityTab(cands)
- setTextFilter("polar")
- getEntityCards()
  - expect count 2
  - expect first card to be Polar-Max candidate
  - expect second card to be Polar-Min candidate
- clearTextFilter()

ADD step: filters: dialog

- selectElection(reg)
- selectEntityTab(cands)
- openFilterDialog()
- getFilters()
  - expect Party, Info: pick multiple..., Info: years of experience
- getFilter(Party)
  - getOption(/No answer/)
    - expect to have text /1/ for the count
  - setSelection(/No answer)
  - dialog.close()
- getEntityCards()
  - expect count = 1
- expect getEntityCard(/Free independent/)
- expect getFilterButtonBadge() like 1
- openFilterDialog()
  - dialog.reset()
- getEntityCards()
  - expect count = 13
- expect getFilterButtonBadge() to be empty
- openFilterDialog()
  - getFilter(Info: pick multiple...)
    - getOptions()
      - expect count 3
    - setSelection(/Choice A|B/)
    - close()
- getEntityCards()
  - expect count = 12
  - expect getEntityCard(/Special candidate AA/) to not be visible
- openFilterDialog()
  - dialog.reset()
- openFilterDialog()
  - getFilter(Info: years of experience)
    - getOptions()
      - expect count 2 (min + max)
      - expect to have text 42 and 99
    - setNumberRange(50, null)
    - close()
- getEntityCards()
  - expect count = 1
  - expect getEntityCard(/Special candidate AA/) to be visible
- openFilterDialog()
  - getFilter(Info: pick multiple...)
    - setSelection(/Choice A|B/)
  - close()
- getEntityCards()
  - expect count = 0
- openFilterDialog()
  - dialog.reset()
