<script>
  import { createEventDispatcher } from "svelte";

  export let i18n = (key) => key;

  const dispatch = createEventDispatcher();

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
    <input type="radio" name="selectedFilter" id="familyFriendly" value="Family-friendly" on:change={changeFilter} checked="true">
    <label for="familyFriendly">Family-friendly</label>
    <input type="radio" name="selectedFilter" id="routeDifficulty" value="Route difficulty" on:change={changeFilter}>
    <label for="routeDifficulty">Route difficulty</label>
  </form>
  {@html i18n('Find Routes Instructions')}
</main>
