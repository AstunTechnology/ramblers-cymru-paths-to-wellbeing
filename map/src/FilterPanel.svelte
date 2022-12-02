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
    <label>
      <input type="radio" name="selectedFilter" value="Family-friendly" on:change={changeFilter} checked="true">
      Family-friendly
      <br>
    </label>
    <label>
      <input type="radio" name="selectedFilter" value="Route difficulty" on:change={changeFilter}>
      Route difficulty
      <br>
    </label>
  </form>
  {@html i18n('Find Routes Instructions')}
</main>
