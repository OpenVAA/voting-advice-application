<script lang="ts">
  import ResearchQuote from '$lib/components/ResearchQuote.svelte';
</script>

# What are the specifics of the elections?

You will need to gather some information about the structure of the elections your VAA deals with.

You’ll probably also need to compile a list of official information sources about the elections that the developer can use. Read more about that in [Data Collection](/publishers-guide/data-collection/intro)

## One or many elections?

It is surprisingly often the case that multiple elections are conducted at the same time.

In such situations, it is usually helpful to combine all elections in the same VAA, because some of the questions (i.e. statements) can often be used for multiple concurrent elections.

### Can the voters choose only some of the elections?

<ResearchQuote
title="Should the voters be able to choose which elections to show?"
author="Veikko Isotalo"
references={['Dehdari, S. H., Meriläinen, J., & Oskarsson, S. (2021). Selective abstention in simultaneous elections: Understanding the turnout gap. Electoral Studies, 71, 102302.']}>

Organizing multiple elections (e.g., parliamentary and local elections) at the same time typically strives to lower the costs for organizing elections and also to increase voter turnout. The idea is to increase voter turnout in the less salient election to match turnout of the more popular one. However, turnout gap might not close completely as some voters still choose to abstain in one election but vote in the other one (see e.g., Dehdari et al. 2021).

When multiple types of elections are combined VAA designers have two options: a) develop distinct VAAs for each election, b) provide only a single VAA in which voters receive recommendations for multiple elections. First option is simpler to implement, but it might create repetition for the users if they need to provide answers to similar statements in both VAAs. Our recommendation would be to implement a combined design, if the number of simultaneous elections is small (2–3). In this way the VAA design aligns with the goal why the elections were organized jointly in the first place, i.e. to encourage voters to cast votes in all election types.

Voters could be allowed to choose in the beginning of the VAA for which election they are looking for advice. This would be beneficial in cases when the voter is only interested in one of the elections or they might have already decided how to vote in the other election. Allowing voters to customize the VAA to their own needs is also a desirable VAA design goal. From another perspective, allowing voters to choose only a single election for the VAA might work against the intended goal of increasing turnout. In this case limiting user autonomy can potentially increase turnout as users receive recommendations for multiple elections. This example illustrates how VAA design choices are not value neutral and it is left for the VAA designer to choose, which values they deem more important for the VAA.
</ResearchQuote>

If your VAA has many elections, the voters can be allowed to select only one of them for answering.

This choice can, however, be disabled, which may be preferred especially in situations where the other election is less well-known or interesting to the voters.

## Which are the constituencies in the elections?

Elections are usually split into constituencies (also called districts, ridings and wards), but in country-wide elections there is only one constituency.

You will need to find a data source for a list of the constituencies (with their names in all the languages you want to use).

If your VAA has multiple elections with different constituencies, you will also need to check if some of them are subparts of the others. This is the case, for example, in combined regional and municipal elections, where each municipality is contained in a region.

This connection is useful, because then the user can only select their municipality and the region can be deduced from that.

## Who can be voted for?

<ResearchQuote
id="open-and-closed-lists"
title="Open and closed lists"
author="Veikko Isotalo"
references={[
'André, A., Depauw, S., Shugart, M. S., & Chytilek, R. (2017). Party nomination strategies in flexible-list systems: Do preference votes matter? Party Politics, 23(5), 589-600.',
'Crisp, B. F., Olivella, S., Malecki, M., & Sher, M. (2013). Vote-earning strategies in flexible list systems: Seats at the price of unity. Electoral Studies, 32(4), 658-669.',
'Isotalo, V. (2020). Designing Voting Advice Applications: The Finnish Case. Master’s thesis. http://urn.fi/URN:NBN:fi:aalto-2020112918207',
'Gemenis, K., & van Ham, C. (2014). Comparing Methods for Estimating Parties’ Positions in Voting Advice Applications. In D. Garzia and S. Marschall (Eds.), Matching Voters with Parties and Candidates: Voting Advice Applications in a Comparative Perspective (pp. 33–48). Colchester, UK: ECPR Press',
'Elklit, J., Pade, A. B., & Miller, N. N. (2011). The parliamentary electoral system in denmark: Guide to the Danish Electoral System. Ministry of the Interior and Health and The Danish Parliament. Copenhagen.',
'Taylor, S. L., & Shugart, M. S. (2017). Electoral systems in context: Colombia. In Erik S. Herron, Robert J. Pekkanen, and Matthew S. Shugart (Eds.), The Oxford Handbook of Electoral Systems, Oxford Handbooks.'
]}>

Open-list and closed-list proportional representation electoral systems are widely spread across the world. These systems pose different needs for VAAs. Closed lists mean that voters can only cast a party vote. Candidates within parties are ranked by their parties and this order cannot be influenced by voters. To name a few, closed lists are used in parliamentary elections in Israel, Spain and Portugal. VAAs in closed-list electoral systems should focus on parties’ stances on political issues, as parties are the ones that voters see on the ballot. VAAs that provide voting advice at the level of parties are called party-based VAAs. Parties can be either asked directly to input their answers to the VAA or one can use experts to evaluate party positions to minimize the risk of parties manipulating their stances (Gemenis and van Ham 2014). It is also possible to use the Kieskompas method, where parties’ self-placements and expert placements are iteratively updated until agreement between their positions are found (see Gemenis and van Ham 2014). Expert evaluation is a suitable method when the number of parties and candidates is small (e.g., n &lt; 20). Expert evaluation is not a viable method when one deals with dozens of candidates, as the workload becomes easily too substantial for the evaluators and it becomes more likely that one cannot find source material to base the evaluations for all candidates’ issue positions.

Table 1 shows the categorization of VAAs based on a cross-tabulation of the placement method and the level of recommendation. VAA recommendations can be provided at the party level, candidate level or on both levels (hybrid). Candidates and parties can be placed on issues based on self-placement or expert evaluation. VAA designers should select the appropriate form for the VAA depending on the electoral system and number of candidates/parties on the ballot.

In open-list proportional representation electoral systems voters are allowed to cast preference votes to candidates and parties have no control over who gets elected within party lists. VAAs should reflect this and allow voters to compare candidate positions to their own positions. VAAs that provide advice on candidate level are referenced as candidate-based VAAs. However, it is not uncommon that candidate-based VAAs also provide party recommendations based on aggregate candidate answers. It is noteworthy that this can be sometimes problematic. For instance, if a party is internally split on a certain issue, determining the party position from candidate answers might not yield accurate results. Countries that employ open lists in parliamentary elections include Brazil, Finland, Poland, Switzerland and Luxembourg. One should keep in mind, when the number of candidates is high, expert evaluation as a placement method is not usually viable. Candidate-based VAAs are also best suited for single transferable vote (STV) electoral systems, where voters can rank multiple candidates on the ballot in their own preference order. Variants of STV are in use in Australia, Ireland and Malta.

Note that in some countries, such as in Denmark and Colombia, parties can determine whether lists are open or closed in any given district (Elklit et al. 2011; Taylor & Shugart 2017). In these cases where both list types are present in the same election, one should follow the same procedure as in the flexible-list case.

Table 1. Categorization of VAAs (modified from Isotalo 2020).

<table>
  <thead>
    <tr>
      <th></th>
      <th colspan="3">Level of recommendation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th rowspan="2">Placement method</th>
      <td>Candidate &<br>Self-placement<br>(open lists)</td>
      <td>Hybrid &<br>Self-placement<br>(flexible lists)</td>
      <td>Party<br>&<br>Self-placement<br>(closed lists)</td>
    </tr>
    <tr>
      <td>Candidate &<br>Expert evaluation*<br>(open lists)</td>
      <td>Hybrid &<br>Expert evaluation<br>(flexible lists)</td>
      <td>Party<br>&<br>Expert evaluation<br>(closed lists)</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="4">* Expert evaluation is often not viable, if there is a high number of candidates.</td>
    </tr>
  </tfoot>
</table>

#### Flexible lists

Electoral systems that employ flexible lists use a mixture of open-list and closed-list rules. In flexible-list proportional representation systems, voters can cast a vote either for a party list as a whole or for a specific candidate. Candidates are per default ranked by their parties, but this order can be overturned if a candidate receives more personal votes than the determined vote quota (Crisp et al. 2013). Flexible-list PR system is the most common electoral system in Europe and it is used in countries such as Austria, Belgium, Croatia, the Czech Republic, Estonia, the Netherlands, Norway, Slovakia and Sweden (André et al. 2017).

In terms of VAA design, flexible lists pose a unique challenge, as potentially both parties’ and candidates’ issue positions matter for the voter. Some flexible-list PR systems (e.g., Norway and Sweden) resemble more closed-list systems, as voters rarely cast preference votes or the thresholds are set so high that candidates have little chances of changing the list order. However, in countries where casting preference votes is more common (e.g., Belgium and Czech Republic) and so-called “ballot jumpers” are commonly elected, VAAs should contain information on individual candidates’ policy preferences.

Our suggestion is to collect and position both party and candidate responses to VAA statements. Voters should also receive voting advice on both party and candidate levels (hybrid level of recommendation in Table 1). Our suggested option would be to display voting advice so that parties are ranked by their congruence with the user and within these parties candidates are ranked by their respective matching score with the user (see Figure 1).

<figure>
<img src="/images/guides/nested-candidate-matches-within-parties.png"
 alt="Screenshot of a VAA built with OpenVAA showing candidate matches nested within party matches." class="h-[40rem] max-h-[80vh]"/>
<figcaption>Figure 1: Parties ranked by match score. Candidates are nested within and also ranked.</figcaption>
</figure>

</ResearchQuote>

The final detail about the elections themselves is who can the voters cast their ballot for. In most cases it is either a candidate or a party or both.

Thus, if the elections follow a closed-list model in which the voters can only vote a party list, not an individual candidate, there’s usually no point in showing the candidates in the VAA either and there will be no use for the VAA’s Candidate Application.

### Do candidates or parties have election symbols?

In many elections, candidates or parties have numbers or symbols that the voters can use instead of the candidate’s name. Check if this is the case in your elections.

## Are there electoral alliances?

It’s also good to check beforehand whether parties can form electoral alliances with each other. These can be shown in the VAA or left out if the information is not easy to gather.
