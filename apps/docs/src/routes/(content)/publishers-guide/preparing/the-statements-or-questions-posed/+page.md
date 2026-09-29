<script lang="ts">
  import ResearchQuote from '$lib/components/ResearchQuote.svelte';
</script>

# What are the statements or questions posed?

<ResearchQuote
title="Statements"
author="Veikko Isotalo"
references={[
'Walgrave, S., Nuytemans, M., & Pepermans, K. (2009). Voting aid applications and the effect of statement selection. West European Politics, 32(6), 1161-1180.',
'Fossen, T., & Van den Brink, B. (2015). Electoral dioramas: on the problem of representation in voting advice applications. Representation, 51(3), 341-358.',
'Haukio, J., & Suojanen, M. (2004). Vaalikone poliittisena mediana. Politiikka, 46(2), 128–136.',
'Gemenis, K. (2013). Estimating parties’ policy positions through voting advice applications: Some methodological considerations. Acta politica, 48(3), 268-295.'
]}>

Statements are the most integral part of the VAAs. If selected statements are not appropriate for the election then the overall usefulness of the VAA will be negligible. Walgrave et al. (2009) have shown that statement selection impacts the recommendations that the VAAs provide. This means that VAA designers have a potential influence on the election outcome, as they can frame what the election is about (Fossen & van den Brink 2015). This means that VAA designers need to consider the quality of the statements and the balance of the selected statements.

First, we need to understand what properties do statements have.

VAA statements that are related to politics typically have links to ideological dimensions, for instance the Left–Right or the Liberal–Conservative. There are also some exceptions, as some local or foreign policy statements might not map out on any dimension.

If a VAA statement links to a dimension then it is also directional. For instance, a statement that says “Workers’ right to strike should be limited” is directional to the right in the Left-Right dimension, as agreement with the statement associated with right-wing politics.

Statements vary by strength / political extremity. For instance a statement “The state should seize the means of production” is directional to the left and it can be labelled as extreme. This means that only those who belong to the extreme end of the ideological dimension will agree with the statement. The statement can differentiate center-left and far left proponents from each other.

Statements can also vary by how abstract/concrete they are. VAA developers often make a distinction between value statements and issue statements. This distinction can be a bit misleading as both types of statements can still relate to underlying ideological dimensions. They only vary by the level of abstraction, as value statements measure general attitudes and issue statements focus on specific policies. Issue statements require more political knowledge from the respondent. An example of a value statement is “The interest of the environment should take precedence over economic growth and job creation if they conflict”, whereas an example of an issue statement would be “Fur farming should be banned in Finland”. Both statements relate to the Materialist–Post-materialist dimension of politics. Even though value statements are not about specific policies they still send a signal about the respondent’s preferences. Issue statements are more demanding as one might need to know what is the current state of affairs and what the implications of proposed policies would be.

Now that we know about properties of VAA statements, we can focus on what makes a good VAA statement. Haukio and Suojanen (2004) have written that good VAA statements

- are relevant for the upcoming election
- are easily comprehensible with comprehensible answer options
- present differences between and within parties
- relate to the tasks of the electoral representative body in the upcoming term
- raise strong emotions in voters or concern important economic issues

This list is by no means exhaustive, but it serves as a good starting point for what one should expect from a VAA statement. To summarize, good VAA statements reveal the preferences of the respondents in terms of relevant political issues and they make differences between parties/candidates apparent.

Gemenis (2013) has also suggested that VAA statements should avoid common issues identified in survey research, namely

1. vague wording,
2. double-barreled structure
3. quantification, and
4. qualification.

It is imperative that all respondents would interpret statements similarly. Double-barrelledness means that multiple statements have been combined together. This proves a challenge for respondents, as they might agree with parts of the statement but disagree with the other part. Then it becomes problematic to choose a single answer for the statement. Statements that include quantifications refer to situations when something should be increased or decreased. These types of statements are difficult to measure using Likert-scales, so it is often recommended that these should be avoided. Qualifications in statements mean that an addition to the core statement affects the interpretation of the whole statement (see Gemenis 2013, 273).

Next, we will discuss the statement structure as a whole, as VAA designers are limited by the number of statements that they can include in their VAA.

</ResearchQuote>

Often the most time-consuming part of a VAA project is statement or question formulation.

Hurrying in this part is also very dangerous, because the recommendations the VAA produces are dramatically affected by the choice of statements.

## Overall process of statement formulation

Statement formulation is usually an iterative process with some or all of these steps:

1. Identification of topics and political dimensions
2. Draft statement formulation
3. Circulation of draft statements to target groups
4. Preparing statements _and_ supporting information to be sent out to candidates or parties
5. Confirming statement loading on political dimensions after answers are received, if applicable

## What are the main topics in the elections?

<ResearchQuote
id="statement-structure"
title="Statement structure and ideological dimensions"
author="Veikko Isotalo"
references={[
'Lefevere, J., & Walgrave, S. (2014). A perfect match? The impact of statement selection on Voting Advice Applications’ ability to match voters and parties. Electoral Studies, 36, 252-262.',
'Isotalo, V. (2021). Improving candidate-based voting advice application design: The case of Finland. Informaatiotutkimus, 40(3), 85-109.',
'Paloheimo, H. (2008). Ideologiat ja ristiriitaulottuvuudet. In H. Paloheimo and T. Raunio (Eds.), Suomen puolueet ja puoluejärjestelmä (pp. 27–60). Helsinki: WSOY',
]}>

Selected VAA statements form what we call a statement structure. Typically, VAAs consist of 20 to 30 statements in total. A good practice is to always include a few extra statements, as not all statements might not work as intended. VAA designers should ensure that the structure is in balance in terms of which issues and ideological dimensions are represented. Unbalanced structure would mean that certain political issues or dimensions would be overrepresented, whereas other dimensions would be underrepresented or completely absent. Statement structures that lean more heavily on certain ideological dimensions might benefit parties that distinguish themselves on these dimensions (see Lefevere and Walgrave 2014). However, it should be noted that there is no official guideline on what the balance should be. Our suggestion is to rely on previously identified ideological dimensions from the country where the elections are held (Isotalo 2021, 101).

For optimal statement balance, one should benchmark which ideological dimensions have been found to be relevant in this national context and how those are relevant for the election at hand (e.g., EU dimension might not be relevant for local elections). If there is no research on ideological dimensions among the electorate or in the party system one could pay attention to the votes and debates that have taken place in the electoral body (e.g., the national parliament, local council) and use these as points of reference. One should also form ideological dimensions based on the response data from parties or candidates using dimension reduction techniques such as factor analysis. Comparing the data-driven and theoretical dimensions to each other is recommended as this can hint, whether the planned dimensional structure works as intended and whether individual statements belong to the dimensions as was expected by theory.

For example, in the Finnish context Paloheimo (2008) has suggested that there are seven dimensions that mark the Finnish party politics:

- Left–Right
- Liberal–Conservative
- Center–Periphery
- National–International
- Monolingual–Bilingual
- Ecological–Materialist
- Elite–People

VAA designers can then reference back to these dimensions when they select their statements and keep count how many statements relate to each dimension. This is one way to ensure that the statement structure is in balance. However, one needs to also pay attention to the internal balance of the dimensions. For instance, having only statements in the Left–Right dimension that are directional to the right would not be desirable. Optimally there would be an equal number of statements that are directional to the left and to the right and these statements would vary in terms of strength so that the whole length of the ideological dimension can be accurately measured.

</ResearchQuote>

Statement formulation can be started from two directions, but it’s best to combine them both.

The first is to identify the main political questions that will be relevant for the next session of the body whose members are being elected.

At this point you may also want to consult the VAA’s target group as well as parties and candidates for topics that they deem important.

The other avenue is to identify the main political dimensions in the political system, as described in [Statement structure](#statement-structure), above.

## How will the statements be categorized?

Before progressing into the actual statement formulation, it may be useful to form a preliminary categorization scheme for them.

If your VAA has many elections, you can have separate categories for each election or allow them to mix. You can also have statements that deal with all elections.

## How many statements will there be?

The number of statements is usually best constrained a bit, because having too many of them will make application too arduous for voters to use – and may also turn off some candidates or parties from answering. On the other hand, having too few, may compromise the quality of the recommendations.

In most VAAs the number of questions is 20–30 (see also [Statement structure](#statement-structure), above). You can, however, create a few extra statements when gathering party or candidate answers, because it may turn out later that some of them don’t produce answers that are distinctive enough.

## Do you want constituency-specific statements?

Statements can be specific to certain constituencies if you wish.

## Statement selection

<ResearchQuote
id="statement-selection"
title="Statement selection process"
author="Veikko Isotalo"
references={[
'van der Linden, C., & Dufresne, Y. (2017). The curse of dimensionality in Voting Advice Applications: reliability and validity in algorithm design. Journal of Elections, Public Opinion and Parties, 27(1), 9–30. https://doi.org/10.1080/17457289.2016.1268144',
'Isotalo, V. (2021). Improving candidate-based voting advice application design: The case of Finland. Informaatiotutkimus, 40(3), 85-109.'
]}>

VAA statements can be developed in multiple stages that might include input from various stakeholders. In the ideation phase, VAA designers can collect ideas for statements from voters, political actors and experts. These statements should then be internally refined to ensure that they meet the standards for acceptable VAA statements. We do also recommend that VAA developers would disclose where the VAA statements came from and which actors took part in the process.

#### Expert consultation

After the ideation phase, VAA statements should then go through internal testing. After the first round of testing, the statements can be sent for experts (e.g., political scientists), for further feedback and refinement. Expert feedback is typically based on theoretical knowledge and experience with surveys or previous VAAs. It is important to ask the experts to justify their recommendations, as this will be important for enhancing learning for the VAA designers and in the case if expert opinions conflict with each other.

#### Voter consultation

One should also use the possibility to gather ideas for statements and feedback on existing formulations from the wider public, if it is possible. For instance, newspapers can ask their readership to answer test statements and comment on them. This kind of pre-VAA answer data is useful although not likely to be representative of the whole VAA user base, as people who tend to leave a comment are more politically interested than most users. The benefit of these pre-VAA users is that they might be a proxy for how political candidates might answer the same statements. More expensive option to test the statements is to run a survey on a demographically representative sample. The main idea for this data is to validate statements and test that the statements work according to one’s initial expectations.

For instance, statements that do not show any differences between users’ that identify with different parties might hint that there are issues with the statement formulation. Moreover, if pre-VAA users’ answers are centered to the neutral option it might indicate that the statement is not easily comprehensible. Importantly, this data can also be used to validate ideological dimensions, if one wants to show parties on ideological scales. This can be done by applying factor analysis on the pre-VAA users’ answer data or on early access VAA users (van der Linden & Dufresne 2017). This step is particularly important for party-based VAAs, as the number of parties is too small to overcome the curse of dimensionality (i.e., fewer responses than there are VAA statements), which prevents scale validation with typical methods.

#### Candidate or party consultation

Parties and candidates might be involved in the VAA statement development in earlier stages of the statement formulation. Here we want to highlight that one can also use candidate or party answers to the VAA (depending which type of VAA is in question) for testing the statement quality, similarly as in the case of users. In practice, this would mean that VAA developers would reserve time after collecting party/candidate answers to analyze the data and select the final set of statements after consulting the party/candidate data. In candidate-based VAAs, when the number of candidates is sufficiently high (n > 300) the candidate data itself can be used to validate ideological dimensions (see Isotalo 2021). This means that candidate-based VAAs do not necessarily need external user data to validate the VAA statements and ideological scales.

To summarize, VAA statements should be updated iteratively after first being tested internally, then with experts, pre-users (or early users), and finally statements should be tested with candidate or party answers. Besides applying theoretical knowledge for selecting VAA statements we recommend the usage of data-driven methods to test the VAA statements. It is especially important to keep an eye on three metrics that might be indicative of an unsuccessful statement:

1. high proportion of “I don’t know” answers or neutral answers,
2. lack of differences between parties/candidates, and
3. no statistical connection to any ideological dimensions.

</ResearchQuote>

## Statement formulation

Once the framing above is ready, it’s time to start formulating the actual statements.

For each statement, you will need the following.

### Answer type

<ResearchQuote
title="Question types and answering scales"
author="Veikko Isotalo"
references={[
'Gemenis, K. (2013). Estimating parties’ policy positions through voting advice applications: Some methodological considerations. Acta politica, 48(3), 268-295.',
'Koljonen, J., Isotalo, V., Ahonen, P., & Mattila, M. (2022). Comparing computational and non-computational methods in party position estimation: Finland, 2003–2019. Party Politics, 28(2), 306-317.',
]}>

Multiple types of questions have been used in VAAs. Most commonly VAAs use statements, which measure user agreement with the statement. Multiple choice questions have also been used, but these are much less common. The main challenge with multiple choice questions is in the scoring of the agreement between the user and the party. In the Finnish case, multiple choice questions were used in the early 2000s VAAs, after which their use was discontinued. Ranking questions have also been used in many modern VAAs. Their benefit is in the ability to survey users’ priorities. Direct self-placements on ideological dimensions have also made an appearance in VAAs, but these are typically used for visualization purposes. VAAs could also use numeric questions, where one has a predefined budget that one should allocate to various activities. Budgeting questions have not been widely used.

Each question type can be paired with suitable answering scales. VAA statements are typically paired up with Likert scales. Gemenis (2013, 270) notes that “VAAs have adopted the summated rating scale approach to measurement”. In practice, this means VAAs have adopted Likert scales, in which, Gemenis (2013, 270) writes, “each individual item by itself is an imperfect indicator of the latent concept (in this case, party policy or ideology). Likert scales aim to fully capture the latent concept by combining responses from multiple items.” Likert scales are typically used to measure agreement with a statement. Most common variants are five-point and seven-point scales, where the answering options range from “strongly agree” to “strongly disagree” with the addition of a neutral answering option in the middle.

Notably some VAA designers have implemented a special variant of a five-point Likert scale where they have removed the neutral answering option. This means that answers are coded “strongly disagree” = 1, “somewhat disagree” = 2, “somewhat agree” = 4, and “strongly agree” = 5. This decision has been justified by wanting political actors to take a stand on the issue and limiting the strategic positioning of political actors to the neutral stance. Another supporting argument has been that the neutral answering option is commonly misused by users as they often think of it as a synonym for “I don’t know”. This is not helped by some VAA developers as they often misuse Likert scale by renaming the central answering option as “I don’t know”. It is important to note that a neutral answer truly means a neutral stance on the issue, not an uninformed opinion.

There are also other ways to measure positions of political actors on political issues. Gemenis (2013) notes that expert and mass surveys typically use interval scales, where parties and respondents are directly positioned on latent dimensions of interest (e.g., Left–Right, Pro-immigration vs. Anti-immigration). Party positioning on latent dimensions can also be achieved with computational methods that use party manifestos, however, these methods are not necessarily very accurate or reliable (see Koljonen et al. 2022).

One of the main differences between the interval scales and Likert scales is that in Likert scales the answer options might not be equidistant (although this is often assumed). As is the case with ordinal scales, the order of the answering options can be established in Likert scales. In interval scales, distances between answering options stay constant (e.g., distance from 0 to 1 is the same as 1 to 2). Interval scales are typically longer than Likert scales. Common variants are 0–10 and 0–100 scales. Likert scales typically use radio buttons as UI elements, but interval scales can employ sliders. However, the main difference in using interval scales is that they require different types of questions, where the one assigns a value directly to their position on the latent dimension.

</ResearchQuote>

There are currently two main answer types available for matching: ordinal responses (e.g. Likert) and categorical responses.

The most common type in VAAs is a 4–7-point Likert answer, ranging from ‘Fully disagree’ to ‘Fully agree’.

You can decide the number of options and their labels but it’s usually best to adhere to existing standards.

Another option is a categorical response in which you can offer any options to the user you deem suitable, e.g.

> What is your favourite color?
>
> - Red
> - Green
> - Blue

The difference with an ordinal response is that these cannot be ordered. In the example above, this means that ‘Red’ is no closer to ‘Green’ than it is to ‘Blue’. In Likert responses, on the other hand, ‘Partly disagree’ is closer to ‘Fully disagree’ than to ‘Fully agree’.

The upshot is that categorical questions do not yield as much information for the matching calculation as ordinal ones do.

### Statement text in all languages

You will naturally need to provide the statement text in all languages your VAA uses.

If you use response options that are not part of the existing translations, you will also need to create translations for each of them.

### Supporting information in all languages

<ResearchQuote
title="Background information for statements"
author="Veikko Isotalo"
references={[
'Kamoen, N., & Holleman, B. (2017). I don’t get it: Response difficulties in answering political attitude questions in Voting Advice Applications. Survey Research Methods, 11(2), 125-140. https://doi.org/10.18148/srm/2017.v11i2.6728',
'Kamoen, N., & Liebrecht, C. (2022). I need a CAVAA: How conversational agent voting advice applications (CAVAAs) affect users’ political knowledge and tool experience. Frontiers in Artificial Intelligence, 5, 835505.',
]}>

#### Introduction

VAA statement design is not limited to formulating the statement itself, but one needs to also consider if there is a need to draft an introduction for the statement. In the introduction, it is important to highlight why the issue matters and what are the alternative viewpoints regarding the issue. Statement introductions are especially relevant for video-based VAAs, where each statement is presented along with their video introduction.

#### Important concepts and current state of affairs

VAA statements might be difficult to understand, which is why it is important for VAA designers to provide clarifying information regarding the VAA statements. This is especially important for VAA users that are new to politics or they have low levels of political sophistication.
VAA users that encounter difficulties in understanding certain statements engage often in satisficing behavior (Kamoen & Holleman 2017). Satisficing means that users do not seek additional information before answering the statement to clarify that they understand the statement, but instead they make assumptions about the meaning of the statement and provide an answer nonetheless (Kamoen & Holleman 2017). VAA user comprehension problems might also manifest as a disproportionately large share of neutral or “I don’t know” answers. In the worst case comprehension problems can lead to unreliable voting advice.

According to Kamoen and Holleman (2017), comprehension problems while filling in the VAA can stem from two sources: 1) semantic problems (i.e., not understanding certain words in the statement), or 2) practical problems (i.e., not knowing the current state of affairs). Both of these problems can hampeter user’s ability to answer and form an opinion on the issue.

To tackle the previously mentioned issues, it is suggested that VAA designers provide background information for statements that deal with concrete issue statements. This means that there should be an UI element (e.g., highlighted text or a separate button) that reveals explanations for key concepts in the statement. There should also be an UI element that explains the current state of affairs (e.g., if the statement deals with inheritance tax, the explanation should briefly explain how the tax is implemented currently). There are alternative versions of how the additional information on the statements could be provided. Instead of relying on users to actively seek this information it could be revealed for users per default. However, we do not recommend all additional information to be shown per default, as this can overload the user unnecessarily.

Alternatively, VAAs can employ a chatbot which could contain pre-coded responses to help users overcome comprehension problems with the VAA statements. Research on Conversational Agent VAAs (CAVAAs) have shown that structured chatbots that have predefined action buttons are more highly valued by users than more open-ended chatbots, where users can formulate their questions freely (Kamoen & Liebrecht 2022).

#### Pros & cons

VAAs might also show what kind of arguments are presented to support or to oppose the statement. This is likely to influence users on how one should think about the issue. However, this can also be educational for users to learn new ways to think about the issue. The main challenge in formulating these pro and con lists has been that the process is labour intensive for the VAA developers (especially if there are many parties and candidates). Some VAAs have implemented solutions where they employ large language models to summarize arguments for and against the issue based on party answers.

</ResearchQuote>

It is often very useful to provide the user additional information about the statement. First, they may understand the statement differently from what you intended and, secondly, they may not know the full specifics affecting the issue.

Supporting information can be in many different formats:

- Plain text
- Text with infographics
- Video

The platform also has WIP functionality for generating drafts of supporting information, such as term definitions and pros & cons, using LLMs.

Whichever option you choose, make sure to also provide a text version of the information for accessibility.

It is also important to have at least a text version of this information ready when the candidates or parties answer the statements to maximise the chance that they understand the statements the same way as the voters.

## Order of statements

<ResearchQuote
title="Order of statements"
author="Veikko Isotalo">

The impact of statement order has not been previously researched in the context of VAAs. However, from survey research it is known that respondents are prone to answering fatigue, meaning that respondents lose focus and interest to complete the survey, as the number of items in the survey increases. This is why the typical length of the VAA has settled around 30 statements (although some outliers with around 70 statements exist).

It is relatively common to see VAAs place concrete issue statements first and more abstract value statements in the end of the VAA. The idea here is to start with more challenging statements first and then ease the difficulty in answering in the latter part of the VAA to encourage users to stick to the end. The downside of this approach is that users that become demoralized by the difficulty of the issue statements might quit the VAA early. Alternative order could be to start with easy statements that do not require a lot of knowledge on politics and then in the very end place the most difficult statements, when the users are close to finishing.

VAAs might also thematically sort their statements into small segments, where statements related to certain policy themes (e.g., the economy, environment, immigration) are asked one after another. While thematic order of statements has its benefits such as structural coherence, it is not the most time-efficient way to survey the user. To maximize time-efficiency VAA statements could be dynamically ordered by their information value. However, this feature is not widely used, and is currently being developed for OpenVAA.

As a general rule, we recommend placing the most engaging VAA statements to the beginning of the VAA. This way users can be persuaded to start the VAA. It is not well-established how large a share of VAA users drop out while answering the statements, but we expect this share not to be substantial. However, most likely the users that are in the risk of quitting the VAA prematurely are the ones that could benefit the most from the VAA advice, i.e., users with low political interest and no party identification.

</ResearchQuote>
