<script>
    export let candidate;
    let party = candidate?.mainParty.data.attributes.party;
</script>

<section class="card w-96 bg-base-100 shadow-xl m-8">
    <div class="card-body">
        <!--TODO: Don't hardcode first and last name order, but allow them to be reversed-->
        <h2 class="card-title">{candidate.firstName} {candidate.lastName}</h2>
        <h3>{party}</h3>
        <p><strong>Political experience:</strong> {candidate.politicalExperience}</p>
    </div>

</section>