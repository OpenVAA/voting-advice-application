<script lang="ts">
  import ResearchQuote from '$lib/components/ResearchQuote.svelte';
</script>

# Designing a VAA

When preparing to publish a VAA follow the steps in this section. Not all of them are relevant in all cases, but it’s worthwhile to check each.

<ResearchQuote title="Tenets of VAA design" author="Veikko Isotalo" references={[
'Garzia, D., & Marschall, S. (2014). The Lausanne Declaration on Voting Advice Applications. In D. Garzia and S. Marschall (Eds.), Matching Voters with Parties and Candidates: Voting Advice Applications in a Comparative Perspective (pp. 227–228). Colchester, UK: ECPR Press.',
'​Isotalo, V. (2021). Improving candidate-based voting advice application design: The case of Finland. Informaatiotutkimus, 40(3), 85-109.'
]}>

There is no universal VAA design that would fit in all contexts. VAA designs are highly dependent on the election type and the electoral system. It also matters for the VAA if the election is a local one instead of a national election. Sometimes multiple elections can be held at the same time, in these cases having separate VAAs for each election might not be optimal for user fatigue.

For determining an optimal VAA design in a specific setting one has to consider the following questions:

- Are there multiple elections at the same time?
- How many electoral districts are there?
- Are there important local issues in different districts?
- Do voters vote for a party or a candidate?
- If voters cast a personal vote, how many candidates are running for the same party?
- Do parties rank candidates in their lists or are candidate positions determined by their personal votes?

Even though there is no universal VAA design which would be suitable for all contexts, a short list of design principles has been suggested by VAA researchers.

According to the Lausanne declaration VAAs should be “open, transparent, impartial and methodologically sound” (Garzia and Marschall 2014, 227–228). Openness refers to accessibility for both users and political actors. Transparency relates to transparency of intentions and funding regarding the VAA development. More broadly, users should be able to know how parties and candidates were positioned on the VAA. Additionally, transparency entails the matching algorithm, which should be understandable to the users. According to the impartiality requirement, all parties should be included in the VAA, and the VAA design should not favor any party in a systematic manner (Garzia and Marschall 2014, 227–228).

Lausanne declaration’s guidelines can be seen as the minimum standards for VAAs. In addition, VAA designers could consider more ambitious design goals. For instance, VAAs could be designed in such a way that they empower their users to modify them to suit their own needs (interactivity and customizability) or that promote honest answering behavior of candidates (see more in Isotalo 2021). To reach the wanted design goals, VAA designers will have to make specific design choices regarding VAA elements such as statements, answering scales, user interface, matching algorithm, and how voting advice is displayed (Isotalo 2021). It is important for VAA designers and developers to keep these design goals in mind and reflect how their design choices achieve the set out goals. The challenge in VAA development stems from the fact that not all design choices work well together. This guide is made to help you navigate through these challenges.
</ResearchQuote>
