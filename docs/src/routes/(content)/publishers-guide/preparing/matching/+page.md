<script lang="ts">
  import ResearchQuote from '$lib/components/ResearchQuote.svelte';
</script>

# How should the recommendations be computed?

The platform offers a robust matching algorithm that can be configured in a few ways.

## What is the minimum number of answers needed for matching?

<ResearchQuote
title="Minimum number of answers"
author="Veikko Isotalo">

For the VAA to function it is necessary that a user answers at least one statement/question for the VAA to calculate a recommendation. However, many VAAs also display users’ positions on ideological scales based on their answers to the VAA statements. In this case, it should be notified to the user that not all features of the VAA will be available, if they do not answer a required set of statements. We recommend that the user should not be limited in their way they want to use the VAA, as it could be that the user is a single issue voter and they only care about one VAA question. There is no need to place an arbitrary number of minimum answers (higher than one), as this could potentially hamper the usefulness of the VAA advice for the user. Minimum number of answers can be set higher only in cases, when the VAA cannot technically provide a recommendation.

Many VAAs have also enabled a viewer-mode, where users can inspect candidate or party profiles without answering any statements. This is a useful feature for users that might have already done the VAA once before and want to simply go back to inspect candidate/party profiles.

</ResearchQuote>

This dictates how many statements the voters must answer before the matches are computed. They can still view the candidate and party lists but no scores will be given.

This number can be anything from 1 up, but if the number is low, the results are not reliable.

## What metric should be used for distance calculation in matching?

<ResearchQuote
title="Algorithmic choices and distance calculation methods"
author="Veikko Isotalo"
references={[
'Downs, A. (1957). An Economic Theory of Democracy. New York: Harper & Row Publishers',
'Isotalo, V. (2020). Designing Voting Advice Applications: The Finnish Case. Master’s thesis. http://urn.fi/URN:NBN:fi:aalto-2020112918207',
'Katakis, I., Tsapatsoulis, N., Mendez, F., Triga, V., & Djouvas, C. (2014). Social Voting Advice Applications-Definitions, Challenges, Datasets and Evaluation. IEEE Transactions on Cybernetics, 44(7), 1039–1052. https://doi.org/10.1109/TCYB.2013.2279019',
'Mendez, F. (2017). Modeling proximity and directional decisional logic: What can we learn from applying statistical learning techniques to VAA-generated data? Journal of Elections, Public Opinion and Parties, 27(1), 31–55. https://doi.org/10.1080/17457289.2016.1269113',
'Merrill, S., & Grofman, B. (1999). A Unified Theory of Voting: Directional and Proximity Spatial Models. Cambridge: Cambridge University Press.',
'Rabinowitz, G., & Macdonald, S. (1989). A Directional Theory of Issue Voting. The American Political Science Review, 83(1), 93–121. https://doi.org/10.2307/1956436',
'Romero Moreno, G., Padilla, J., & Chueca, E. (2020). Learning VAA: A new method for matching users to parties in voting advice applications. Journal of Elections, Public Opinion and Parties, 1–19. https://doi.org/10.1080/17457289.2020.1760282'
]}>

VAAs can use different matching algorithms to determine the best suitable candidate/party. Isotalo (2020, 33-38) notes that there have been different types of general approaches for matching algorithms. The most prevalent algorithm is based on issue distance between the user and the candidate/party, which follows the issue voting paradigm. There have been attempts to include additional factors to the issue distance model (e.g., candidate social media posts, candidate incumbency status). However, these external sources can introduce bias to the recommendations. Additionally, there have been attempts to include community-based recommendations to VAAs (see Katakis et al. 2014) or use machine learning to calibrate distance matrices of statements (Romero Moreno et al. 2020). Here, we will focus on the most common variants of the issue distance algorithms.

According to Isotalo (2020, 39) there are five design choices that the VAA designer has to make regarding the matching algorithm:

1. “choosing the number of dimensions of the modelling space,
2. “choosing how questions are combined to form the dimensions,
3. “choosing a distance matrix for an appropriate spatial model,
4. “choosing a method to aggregate the overall distance scores between a user and a candidate in the modelling space and
5. “choosing whether questions can be weighted.”

For an in depth explanation, we recommend the reader to consult Isotalo (2020, 39-43). Here, we will introduce the most popular models of issue voting and distance metrics that will get you started.

#### Issue voting: Proximity vs. directional models

How to determine which party to vote for based on stances on political issues alone? This question piqued the interest of political scientists since the 1950s. Downs (1957) suggested that rational utility maximizing voters vote for parties that are the most proximate to their own ideological positions. Alternative view, introduced by Rabinowitz and Macdonald (1989), suggests that voters prefer parties that have directional (clear) political stances on issues (see more Isotalo 2020, 24-30). Other models have also been introduced (see Merrill & Grofman 1999), but these models have not been widely implemented in the context of VAAs.

Both proximity and directional models can be easily implemented in VAAs (see Figure 1). Values in the figure represent distance scores associated with combinations of user and candidate answers on five-point Likert scale ranging from completely agree (CA) to completely disagree (CD). Total agreement gets a positive score of +1, whereas a total disagreement is shown as -1. It is also possible to combine the two theories into a hybrid matrix (Panel C). We recommend an implementation, where the user can choose the issue voting model that they prefer.

<figure>
<img src="/images/guides/distance-matrices.png"
 alt="Distance matrices in Isotalo (2020, 41)" class="w-full"/>
<figcaption>Figure 1. Distance matrices in Isotalo (2020, 41). First matrix from the left shows the proximity model (panel A), the middle matrix (panel B) displays the directional model, and the right one (panel C) displays the combination of the two. All panels use Manhattan distance metric.</figcaption>
</figure>

#### Distance metrics

According to Isotalo (2020, 41) there are three main metrics that can be used to aggregate distance scores in multi-dimensional space:

1. Manhattan distance,
2. Euclidean distance and
3. Mahalanobis distance.

The decision, which distance metric one should use is dependent on the dimensional structure of the VAA. If the VAA is providing its recommendations in a low-dimensional space, then Euclidean distance is a valid choice. In high-dimensional spaces, Manhattan distance is a preferable choice. The Euclidean distance metric is not an optimal choice for aggregating distances in high-dimensional space, as the metric uses list-wise deletion to deal with missing values (Mendez 2017, 50-51).

Both Euclidean and Manhattan distance metrics ignore possible correlations of VAA items assuming their independence. Mahalanobis distance metric takes into consideration these correlations (Katakis et al. 2014, 8). However, using Mahalanobis distance is more demanding as it requires data (either candidate or pre-user data) to form the covariance matrix which establishes the relations of issue variables Isotalo (2020, 42).

</ResearchQuote>

The distance calculation metric can also be changed from the commonly used Manhattan or ‘city block’ metric to something else.

If you’re unsure, it’s best not to change the metric.

## Should matches be calculated for statement categories?

<ResearchQuote
title="Sub-category matching"
author="Veikko Isotalo">

Sub-category matching is possible to implement if VAA statements are labelled into different themes, e.g., economy, environment, etc. Sub-category matching means a way to show the user their match with a party/candidate in separate issue categories. Users can find it helpful to identify candidates that match with them the best on a specific policy theme that they care about.

The same principle can be applied when the VAA calculates ideological positions based on multiple statements. In this case, the user could then be shown which candidates/parties match the highest on particular ideological dimensions (e.g., the Left–Right dimension).

<figure>
<img src="/images/guides/subcategory-matches.png"
 alt="Screenshot of a VAA built with OpenVAA showing subcategory matches for candidates." class="h-[40rem] max-h-[80vh]"/>
<figcaption>Figure 1: Subcategory matches for candidates for the four categories whose statements the voter has answered.</figcaption>
</figure>

</ResearchQuote>

Voters can also be shown results for each candidate or party in each of the categories you have divided the statements into.

This can offer richer information in the results list in addition to the simplifying matching score.

## How to treat missing candidate or party answers?

<ResearchQuote
title="Imputing missing answers"
author="Veikko Isotalo"
references={[
'Isotalo, V. (2021). Improving candidate-based voting advice application design: The case of Finland. Informaatiotutkimus, 40(3), 85-109.',
'Mendez, F. (2017). Modeling proximity and directional decisional logic: What can we learn from applying statistical learning techniques to VAA-generated data? Journal of Elections, Public Opinion and Parties, 27(1), 31–55. https://doi.org/10.1080/17457289.2016.1269113',
]}>

Let’s imagine a scenario where a user answers to all 30 VAA statements and a candidate happens to only answer to one statement in the whole VAA. The user and the candidate are in complete agreement in that one statement. Should the candidate receive a matching score of 100%? Imagine that this candidate is recommended to the user over another candidate that received 87% matching score in all 30 statements. In our opinion, this is not how the VAA should function. There are alternative strategies to avoid this situation.

Mendez (2017, 50–51) suggests using recommendation scores that range from -100 to +100. This operationalization of the matching score has the benefit that missing party/candidate responses can be incorporated to the matching, so that they make the matching scores gravitate towards the middle point of the scale (zero). Mendez (2017) suggests that one divides the sum of matching scores with the candidate by the number of statements to which the user has responded. For example, if the user has all 30 statements, but the candidate has responded to only 15 statements, and in those 15 statements they have responded exactly the same way (sum of matching scores: 15/15) the agreement would be 15/30 = +50 in the range of -100 to +100.

Alternative solution is to perform imputation of missing values. It is a common practice that VAAs assign the value of total disagreement between the user and the candidate, if the candidate has not provided any answer to the statement (and the user answered the statement). In a five-point Likert scale this would mean the difference of answering “completely agree” and “completely disagree”.

In the case of ideological matching (see Isotalo 2021), some methods (e.g., confirmatory factor analysis) allow calculation of factor scores with missing values. Missing values increase the confidence intervals of the point estimates.

We recommend using the method recommended by Mendez (2017), if it is applicable with the algorithmic design of the VAA. In other cases, imputation can be performed with the value of total disagreement. However, this needs to be communicated with the candidates/parties that they know the associated cost of not answering.

> Note. The Mendez method is currently not implemented in OpenVAA, but we’re working on adding it.

</ResearchQuote>

The default option is that only candidates or parties who have answered all statements are included in the VAA.

It is also possible to allow them to leave some answers empty, in which case they may be penalised in the results calculation by treating empty answers as maximally distant from the voter’s answer.

## How should party scores be computed from candidate answers?

If candidates answer your VAA but you also want to show party scores, these can be computed from their candidates’ answers. Note that the best way would be to get the answers directly from the parties, because their candidates (especially those having answered the VAA) may not have followed the party line in their answers.
