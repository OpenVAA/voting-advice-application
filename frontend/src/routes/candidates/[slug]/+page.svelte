<script>
    export let data;
    let party = data?.mainParty?.data?.attributes?.party;
</script>

{#if data}
    <section class="card w-96 bg-base-100 shadow-xl m-8">
        <div class="card-body">
            <!--TODO: Don't hardcode first and last name order, but allow them to be reversed-->
            <h2 class="card-title">{data.firstName} {data.lastName}</h2>
            <h3>{party}</h3>
            <p><strong>Political experience:</strong> {data.politicalExperience}</p>
        </div>
    </section>
{/if}