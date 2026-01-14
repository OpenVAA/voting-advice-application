<script lang="ts">
  import ResearchQuote from '$lib/components/ResearchQuote.svelte';
</script>

# What should the voter see when using the VAA?

There are a number of choices you can make that affect the way the VAA works for the voters.

Most of these can be changed even when the VAA is already running in the [App Settings](/publishers-guide/app-settings), but it’s of course better to decide on them beforehand.

## Overview of the voters’ VAA process

When voters use the VAA, the process they go through includes the steps below, some of which are optional.

1. Introductory
   1. Front page
   2. Optional introduction about the next steps in using the VAA
   3. Optional selection of elections if the VAA has multiple elections and you have allowed voters to choose from them
   4. Constituency selection if applicable
2. Answering statements
   1. Optional introduction to statements and statement categories with possible category selection
   2. Optional introduction to each statement category, possibly with option to skip the category
   3. View each statement with options to:
      - view supporting information
      - return to previous statement
      - skip the statement
      - answer the statement
      - clear answer if already answered
      - optional: jump directly to results if available
      - optional: set statement weight
      - optional: see real-time results for the top candidates or parties when answering
3. Results
   1. Optional introductory content at the start of the results page
   2. Selection of the election for which to show results if the VAA has multiple elections
   3. Selection between candidates and parties if both are available (for the selected election)
   4. Apply filters to the results if available
4. Details of a single candidate or party
   1. The user may click on any candidate or party to show their details (with regard to the selected election if there are many) which may include:
      - answers to statements compared to the voter’s answers
      - other details including name, possible election symbol and answers to non-statement questions
      - in case of parties, a list of their candidates

In addition to them they may use the application menu at any time to access other content or move back to previous steps:

- Return to the front page (step 1 above)
- Return to answering the statements (step 2)
- Go to results or browse candidates and parties if the voter hasn’t answered enough statements (step 3)
- View information about the elections
- View information on how the VAA works
- View privacy information
- Send feedback
- Clear the answers they have given
- Change application language (if multiple are available)

## Which intro screens should there be?

Voters can be shown information about the elections or the VAA in various stages of the process, especially category intros which are shown to users when they answer the VAA statements. They are used to describe the theme of the upcoming VAA statements. This feature is by no means essential for the VAA user experience, but setting up these categories might help the user to navigate through the answering process.

## Should the voter be able to select or skip categories?

<ResearchQuote
title="Category selection"
author="Veikko Isotalo">

If category labels are assigned to VAA statements, then it is possible to allow the user to select which categories of statements they wish to answer. Category selection feature is usually shown to the user before they start answering the VAA statements.

This is a potentially useful feature, if there is a high number of statements. On one hand, allowing users to choose which categories they wish to answer increases the utility of the VAA from the user perspective, as users are not shown statements that they do not care about. On the other hand, if the user removes multiple categories of statements, the VAA might not be able to function as intended. Presenting the categories in the beginning of the VAA might also create confusion among the users, as they might not be sure whether all statements are per default included to the VAA or if they have to select them to be included.

Our recommendation is to disable the category selection feature, unless there are certain categories of statements that are seen as supplementary. In a typical case, where all VAA statements are perceived to be important for the user experience, there is no need for this feature, as users can always skip unwanted statements when they are shown.

<figure>
<img src="/images/guides/category-selection.png"
 alt="Screenshot of a VAA built with OpenVAA showing category selection." class="h-[40rem] max-h-[80vh]"/>
<figcaption>Figure 1: Category selection with three out of five categories selected.</figcaption>
</figure>

</ResearchQuote>

If the statements are divided into categories, the voter may be given the options to:

- select which categories to answer to in the optional category introduction view
- skip a single category when shown its optional introduction

## Should the voter be able to skip individual statements?

<ResearchQuote
title="Skipping statements"
author="Veikko Isotalo">

Users should be able to skip a statement if they desire to do so. One should keep in mind that users that are unsure and wish to skip a Likert scale item, might often mistakenly choose the center of the Likert scale, which is a neutral answer option. Neutral answer is always part of the VAA’s matching calculation, whereas skipping the statement means that it has no influence on the VAA’s recommendation. Therefore, it is important to place the skip-button to a visible spot in the UI and to encourage its use.

<figure>
<img src="/images/guides/skip-statement.png"
 alt="Screenshot of a VAA built with OpenVAA showing the button for skipping statements." class="h-[40rem] max-h-[80vh]"/>
<figcaption>Figure 2: The skip button is by default placed below the answering options.</figcaption>
</figure>

</ResearchQuote>

Individual statements can be skipped by default.

## Should the voter be able to set statement weights?

<ResearchQuote
title="Statement weights"
author="Veikko Isotalo"
references={[
'Gemenis, K. (2013). Estimating parties’ policy positions through voting advice applications: Some methodological considerations. Acta politica, 48(3), 268-295.'
]}>

User weights, also known as salience weights, allow users to express how important of a role they want to give to any statement in the VAA’s recommendation. This is significant because Likert scales cannot measure salience (Gemenis 2013, 270). This means that it is possible to have an extreme position on a political issue but the voter might still deem the issue to have low importance (salience).

A common variant of user weights is a three-level version: 0.5, 1.0, and 2.0. Here, a weight of 0.5 means that the user deems the statement less important and the statement’s impact on the VAA’s advice is halved. The weight of two means double the importance. Default weight of 1.0 means normal importance. Typically, users can perform weighting of a statement while they answer the statement. However, it might be easier for the user to perform weighting after they have seen all the statements, as then they can truly evaluate which ones they deem important. We recommend an implementation, where after answering the statements, users could see an overview of all their answers and adjust any statement’s weights.

Before enabling user weights, it is important to verify that the VAA’s matching method is compatible with them.

</ResearchQuote>

Voters may be given the option to mark some statements more or less important than others so that a statement affects the results, for example, twice or half as much as the others.

Currently, however, this will mean that answering the statements is a little bit slower for the user, so enabling this option must be considered with that in mind.

## Should the voter be able to jump into results?

<ResearchQuote
title="Shortcut to results"
author="Veikko Isotalo">

A shortcut to results can be displayed to the users while they are filling the VAA statements. This feature increases user’s ability to modify the VAA experience to their own needs. However, allowing users to proceed to results before answering most of the statements might make the VAA not work as intended and it can have a negative effect on the statement structure balance. These factors should be kept in mind when including this feature.

<figure>
<img src="/images/guides/results-link.png"
 alt="Screenshot of a VAA built with OpenVAA showing the shortcut to results." class="h-[40rem] max-h-[80vh]"/>
<figcaption>Figure 1: The shortcut to results is in the top-right corner of the screen.</figcaption>
</figure>

</ResearchQuote>

Voters may be given the option to jump directly to the results when they have answered the minimum number of statements for results to be computed. If enabled, they will see a discrete jump to results button in the application header.

## Should the voter see real-time results when they answer statements?

<ResearchQuote
title="Quick results"
author="Veikko Isotalo"
references={[
'Isotalo, V. (2021). Improving candidate-based voting advice application design: The case of Finland. Informaatiotutkimus, 40(3), 85-109.'
]}>

Quick results, also known as “live match tracking” of the results, is a feature that shows the real time matching scores of most congruent parties/candidates to the user, while they are still answering the VAA statements (see Isotalo 2021). Usually this feature is implemented by showing maximally five party logos or candidate photos along with their matching scores in the upper corner of the UI. Users are prompted to notice how the top matches and their matching percentages change based on their statement responses.

To this date, there is no research on the potentially biasing effects of this feature. However, there is some anecdotal evidence that this feature can change user’s response patterns, as users might want to mimic their most preferred candidate’s responses. Our recommendation is to use the quick results feature as an optional feature that is per default hidden to the users and they can enable/disable it, if they wish to do so.

<figure>
<img src="/images/guides/quick-results.png"
 alt="Screenshot of a VAA built with OpenVAA showing quick results." class="h-[40rem] max-h-[80vh]"/>
<figcaption>Figure 3: Top 7 live matches at the top of the screen in an experimental VAA.</figcaption>
</figure>

</ResearchQuote>

A list of the top 5 or so candidates or parties can be shown to the user when they are answering the statements. This may heighten user engagement but may also have an adverse effect on how the VAA is used.

This is an experimental feature and only available if the VAA has a single election.

## Should the voter see candidates, parties or both in the results and in which order?

<ResearchQuote
title="Section order"
author="Veikko Isotalo">

In displaying the results, the order of VAA recommendations becomes relevant, when the VAA provides advice on multiple levels (e.g., candidates and parties). This means that the VAA in question is a hybrid VAA. This type of VAA is suitable for electoral systems that use flexible lists. In open-list systems, party recommendations can also be provided based on aggregate candidate responses (e.g., the party median). When both candidates and parties are recommended by the VAA, which ones should be displayed first?

This is not a trivial question, as some VAA users might be limited by the time they are willing to spend investigating the VAA. These users might look at the VAA’s results only once before leaving the site. Therefore, it is important to consider which advice is shown to them first.

For open-list systems, we recommend showing the candidate advice first, especially if the party positions are candidate response aggregates, which might not be reflective of official party positions. As mentioned earlier in [Open and closed lists](/publishers-guide/preparing/the-specifics-of-the-elections#open-and-closed-lists), we recommend VAAs in flexible-list systems to display voting advice on parties within which candidates are nested and ordered by their respective matching score with the user.

</ResearchQuote>

In the results (or browse) view, the voter can be given the choice of viewing either candidates or parties, if applicable.

Even in elections in which the voters are casting their ballot directly for a candidate, it is often meaningful to list the parties as well.

You can decide which views to show and which one of them is shown first. In VAAs with multiple elections, the same setting applies to all elections.

## What info about the candidates and parties should be shown in the results list?

<ResearchQuote
title="Candidate card contents"
author="Veikko Isotalo">

Candidate card contents can include all sorts of collected information regarding the candidate (e.g., demographic information) or their congruence on various political issues with the user. One option is to display the same information that will be displayed by party lists in the election booth. In the Finnish case, this would mean displaying candidate number, party name, candidate occupation or education level. Commonly, candidate cards include a photo of the candidate.

#### Featured answers

Featured answers is an option to provide a fast glance at a couple of candidate answers. These answers can consist of predefined statements or they can be selected automatically, so that they display statements where the candidate and the user disagree/agree the most. From the user perspective, it is probably the most beneficial to see what are their main sources of disagreement with each candidate without opening the candidate profiles.

</ResearchQuote>

For candidates, their name, possible portrait, possible election symbol, nominating party and matching score are shown by default in the results list.

For voters to be able to better distinguish candidates from each other (before opening their details), on the list can also be shown:

- the matching scores for each statement category (see [How should the recommendations be computed?](/publishers-guide/preparing/matching))
- their answers to any question or statement, such as their election manifesto.

<ResearchQuote
title="Party card contents"
author="Veikko Isotalo">

Party cards can display the list of candidates in the order of their list ranking in flexible-list and closed-list electoral systems. Alternatively, party cards can display candidates based on issue congruence, if VAA candidate data exists. It is left for the VAA designer to choose how many top candidates are shown in the party card.

</ResearchQuote>

For parties, the list may also include the top 3 candidates from that party along with their matching scores.

## What details of the candidates and parties should be shown when they’re viewed individually?

When the voter clicks on a candidate or party in the results view, the target’s details are shown in a popup.

These details may include any of the following divided into tabs:

- answers to statements compared to the voter’s answers
- other details including name, possible election symbol and answers to non-statement questions
- in case of parties, a list of their candidates

If parties haven’t answered the statements directly and you’re relying on answers approximated from their candidates’ answers, showing these as the party’s answers may be misleading.
