<script>
  import { createEventDispatcher } from "svelte";

  export let i18n = (key) => key;

  const dispatch = createEventDispatcher();
  
  let mode = 'Family-friendly';

  function changeFilter(evt) {
    mode = evt.target.value;
    dispatch("filterChange", { result: mode });
  }
</script>

<main class="panel-content filter-panel">
  <header>
    <h1>{i18n("Find Routes")}</h1>
  </header>
  <form>
    <input type="radio" name="selectedFilter" id="familyFriendly" value="Family-friendly" on:change={changeFilter} checked="true">
    <label for="familyFriendly">{i18n('familyfriendly_true')}</label>
    <input type="radio" name="selectedFilter" id="routeDifficulty" value="Route difficulty" on:change={changeFilter}>
    <label for="routeDifficulty">{i18n('Difficulty')}</label>
  </form>
  {#if mode === 'Family-friendly'}
  <table class="filterLegend">
    <tr>
      <td class="familyfriendly-true">{i18n('familyfriendly_true')}</td>
    </tr>
    <tr>
      <td class="familyfriendly-false">{i18n('familyfriendly_false')}</td>
    </tr>
  </table>
  {:else}
  <table class="filterLegend">
    <tr>
      <td class="difficulty-a">{i18n('difficulty_a')}</td>
    </tr>
    <tr>
      <td class="difficulty-b">{i18n('difficulty_b')}</td>
    </tr>
    <tr>
      <td class="difficulty-c">{i18n('difficulty_c')}</td>
    </tr>
    <tr>
      <td class="difficulty-d">{i18n('difficulty_d')}</td>
    </tr>
    <tr>
      <td class="difficulty-e">{i18n('difficulty_e')}</td>
    </tr>
  </table>
  {/if}
  
  {@html i18n('Find Routes Instructions')}
</main>
