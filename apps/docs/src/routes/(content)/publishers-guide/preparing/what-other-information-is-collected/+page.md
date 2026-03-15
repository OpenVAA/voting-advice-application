<script lang="ts">
  import ResearchQuote from '$lib/components/ResearchQuote.svelte';
</script>

# What other information is collected from candidates and parties?

<ResearchQuote
title="Use case: recommendation filters "
author="Veikko Isotalo"
references={[
'Isotalo, V. (2021). Improving candidate-based voting advice application design: The case of Finland. Informaatiotutkimus, 40(3), 85-109.',
'Shugart, M. S., Valdini, M. E., & Suominen, K. (2005). Looking for locals: Voter information demands and personal vote‐earning attributes of legislators under proportional representation. American Journal of political science, 49(2), 437-449.',
'Giger, N., Holli, A. M., Lefkofridi, Z., & Wass, H. (2014). The gender gap in same-gender voting: The role of context. Electoral Studies, 35, 303-314.',
'Arceneaux, K., & Vander Wielen, R. J. (2023). Do voters prefer educated candidates? How candidate education influences vote choice in congressional elections. Electoral Studies, 82, 102596.'
]}>

It has been suggested by Isotalo (2021) that VAAs should make use of filters to improve the VAA user experience. To make the VAA recommendation relevant for the user, one should be able to incorporate other types of information to the VAA recommendation that reflects issue congruence. Voters rarely rely on a single source of information, when they decide which party/candidate to vote for.

When voting for candidates voters deem candidates’ demographic attributes also important. Candidate gender and age are especially important, as it is common for voters to limit their search for viable candidates based on these factors. Same-gender voting is a well-established pattern among voters (Giger et al. 2014). Moreover, voters also prefer voting for local candidates that come from the same area as the voter (Shugart et al. 2005). It has also been established that voters select candidates with higher education levels (Arceneaux & Vander Wielen 2023). Our suggestion is to provide the VAA users options to filter the list of recommended candidates/parties in the results page based on relevant candidate/party information that can be useful for their voting decision.

<figure>
<img src="/images/guides/results-filters.png"
 alt="Screenshot of a VAA built with OpenVAA showing filters used in candidate results." class="h-[40rem] max-h-[80vh]"/>
<figcaption>Figure 1: Filtering candidates by age and education.</figcaption>
</figure>

</ResearchQuote>

In addition to their replies to the statements used in matching, other information is usually collected as well.

These pieces of information are useful for voters to get a fuller picture of the candidate or party, not captured by the formulaic statements. Popular options are:

- Date of birth
- Photo
- Election manifesto
- Gender
- Occupation
- Education
- Links to social media sites

Additionally, voters can use these as filtering criteria when they view their results to see, e.g., candidates of a certain age.

The answer to any of these questions can also be shown along the matching scores in the results list.
