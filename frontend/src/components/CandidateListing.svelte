<script>
    export let candidate;
    let id = candidate?.id;
    let attributes = candidate?.attributes;
    let party = attributes?.mainParty.data.attributes.party;
</script>

<section class="card w-96 bg-base-100 shadow-xl m-8">
    <a href={`/candidates/${id}`} >
        <div class="card-body">
            <!--TODO: Don't hardcode first and last name order, but allow them to be reversed-->
            <h2 class="card-title">{attributes.firstName} {attributes.lastName}</h2>
            <h3>{party}</h3>
        </div>
    </a>
</section>