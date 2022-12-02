<script>
  import { createEventDispatcher } from "svelte";

  export let i18n = (key) => key;

  const dispatch = createEventDispatcher();

  let filters = ["Family-friendly", "Route difficulty"];
  let selectedFilter = "familyFriendly";
  
  function changeFilter(evt) {
    dispatch("filterChange", { result: evt.target.value });
  }
</script>

<main class="panel-content filter-panel">
  <header>
    <h1>{i18n("Find Routes")}</h1>
  </header>
  <form>
    <!-- Family Friendly Filter here... -->
    {#each filters as filter}
    <label>
      <input type=radio bind:group={selectedFilter} value={filter} on:change={changeFilter}>
      {filter}
      <br>
    </label>
    {/each}
  </form>
  {@html i18n('Find Routes Instructions')}
</main>
