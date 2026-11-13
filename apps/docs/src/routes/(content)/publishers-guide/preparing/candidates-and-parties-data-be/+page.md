# How should candidates’ and parties’ data be collected?

The complexity of collecting data for your VAA will depend greatly on whether it will be based on parties or candidates – and how many of these will there be.

For each, you will need to collect:

- their basic information such as name
- possibly a candidate portrait or party logo
- their answers to the statements with possible accompanying free-form explanations
- which election and which constituency they’re standing in
- for candidates, the party nominating them
- for parties, the possible electoral alliance they belong to (in each constituency)
- their possible election number or symbol

Candidates and parties can enter the election and the constituency they stand in themselves in the candidate application, together with the party or the alliance they stand under and their election symbol. There is one limitation to plan for: in the application a candidate or a party is given one constituency for each election. A party that stands in several constituencies of the same election cannot add them itself. You, as the administrator, add that party’s nominations when you import your data, one for each constituency. The party’s user can then edit the election symbol and the alliance of each of them in the application, and each change must be confirmed by an administrator before voters see it. Any such edit sets that nomination back to unconfirmed, so a nomination voters could already see is hidden from them until an administrator confirms it again.

If there is only a small number of parties, you may be able to collect these data manually with online forms or by sending spreadsheets to fill.

In candidate-based settings, this is, however, seldom feasible and you will need to enable the platform’s candidate application so that they can enter their data themselves.

## How should candidates register for the VAA?

For candidate registration, there are two options.

### 1. Email-based registration

This is the simpler choice, but you will need to collect a list of the candidates’ emails. Because the electoral authorities do not usually publish such lists at all or early enough, you will usually need to contact the parties standing in the elections to get these lists.

Once you have the lists, the candidates can be added to the VAA and each invited by their email address. An invitation is a record that says which candidate an address belongs to. Creating it sends no email: you tell the candidates that they are invited, and each of them asks for a sign-in link to their address on the Candidate App's registration or sign-in page, opens it, and sets a password before they enter their data.

In this release an invitation is created through the backend's API; the application has no page for that. An invitation sent to an email address works only when the `email` registration mode is allowed for the candidates, and one with a registration code only when `code` is (see [App settings](/publishers-guide/app-settings)). See [Invitation](/developers-guide/contestant-app/pre-registration-and-invitation) in the Developers' Guide. Email that an administrator sends through the application goes only to people who already have an account with a role in the project, so it cannot remind an invited candidate who has not signed in yet.

### 2. Registration with bank authentication

In some cases, however, procuring the candidates lists from the parties may be hard or impossible.

With registration by bank authentication, anyone can register as a candidate, or register a party, by identifying themselves with their online banking credentials, and enter their data in the application. No list of email addresses is needed: after identifying, each person gives the email address they will use to sign in, and confirms it by a link sent to it.

A candidate's name is taken from the bank identity. Their birth date and personal identity code are not stored. Each candidate or party then states in the application which election and constituency they stand in and, for a candidate, which party nominates them. Those nominations are not shown to voters until an administrator has confirmed them, so you can check each one against the official lists before the VAA is published.

The registration modes are chosen in the [app settings](/publishers-guide/app-settings), separately for candidates and parties.

The downside of using the bank-authentication method is that it will require a subscription to an authentication provider, which may cost up to a few thousands of euros. It will also require a somewhat more complex setup than the simple method.

## Where can official election lists be found?

In order to corroborate the data candidates give out – such as which party they stand for and in which constituency – it is best to rely on the official electoral lists published by the body organising the elections. And if you’re using registration with bank authentication, these will be required to confirm the nominations candidates and parties state themselves.

## How long should the application be open for candidates?

We recommend keeping the application open for candidates for at least one or 1.5 months but preferably a bit longer.

It’s usually advisable to also close it for candidates before the VAA is published to voters so that the results they receive do not change (and that you have time to moderate the answers if necessary).

## How will you offer technical support for candidates?

It is very often the case that candidates will require assistance when registering for or using the candidate application.

In our experience up to 10% or even 20% of candidates may contact support, so it’s best to have a clear plan for dealing with such requests.

A spike in such attempts will probably take place right before the deadline for candidates to submit their answers – or within a week _thereafter_ as those who missed the deadline still want to enter their information. (The application can be reopened if you so wish.)

The candidate application also has a Frequently asked questions page onto which answers to common problems can be added.
