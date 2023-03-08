<script>
  import { createEventDispatcher } from "svelte";
  import Gazetteer from "./Gazetteer.svelte";

  export let i18n = (key) => key;
  export let lang = "en";

  export function setMapState(state) {
    mapState = state;
  }

  const dispatch = createEventDispatcher();

  // Either "community" or "route"
  let mapState = "community";
  // Either "Family-friendly" or "Route difficulty"
  let selectedFilter = "Family-friendly";

  function changeFilter(evt) {
    selectedFilter = evt.target.value;
    dispatch("filterChange", { selectedFilter });
  }
</script>

<div class="panel-content filter-panel">
  <h1>{i18n("Find Routes")}</h1>
  <Gazetteer on:select {lang} {i18n} />
  {#if mapState === "route"}
    <fieldset>
      <legend>{i18n("Colour routes by")}</legend>
      <form>
        <input
          type="radio"
          name="selectedFilter"
          id="familyFriendly"
          value="Family-friendly"
          on:change={changeFilter}
          checked={selectedFilter === "Family-friendly"}
        />
        <label for="familyFriendly">{i18n("familyfriendly_true")}</label>
        <input
          type="radio"
          name="selectedFilter"
          id="routeDifficulty"
          value="Route difficulty"
          on:change={changeFilter}
          checked={selectedFilter === "Route difficulty"}
        />
        <label for="routeDifficulty">{i18n("Difficulty")}</label>
      </form>
      <h4 class="legend">{i18n("Legend")}</h4>
      {#if selectedFilter === "Family-friendly"}
      <div style="display: flex; width: 100%;">
        <table class="filterLegend">
          <tr>
            <td class="familyfriendly-true">{i18n("familyfriendly_true")}</td>
          </tr>
          <tr>
            <td class="familyfriendly-false">{i18n("familyfriendly_false")}</td>
          </tr>
        </table>
        <img src="/static/img/key_path.svg" alt="Key to path symbols" style="margin-left: 5em;" />
        </div>
      {:else}
      <div style="display: flex; width: 100%;">
        <table class="filterLegend">
          <tr>
            <td class="difficulty-a">{i18n("difficulty_a")}</td>
          </tr>
          <tr>
            <td class="difficulty-b">{i18n("difficulty_b")}</td>
          </tr>
          <tr>
            <td class="difficulty-c">{i18n("difficulty_c")}</td>
          </tr>
          <tr>
            <td class="difficulty-d">{i18n("difficulty_d")}</td>
          </tr>
          <tr>
            <td class="difficulty-e">{i18n("difficulty_e")}</td>
          </tr>
        </table>
        <img src="/static/img/key_path.svg" alt="Key to path symbols" style="margin-left: 5em;" />
        </div>
        <p><a target="_blank" href="/static/data/grading/difficulty_gradings.pdf" 
        title="{i18n('Ramblers route difficulty definitions')} ({i18n('opens in new tab/window')})">{i18n('Ramblers route difficulty definitions')}</a></p>
      {/if}
    </fieldset>
  {/if}
  <fieldset class="instructions">
    <legend
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24px"
        height="24px"
        ><path
          d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 11 7 L 11 9 L 13 9 L 13 7 L 11 7 z M 11 11 L 11 17 L 13 17 L 13 11 L 11 11 z"
        /></svg
      >&nbsp;{i18n("Instructions")}</legend
    >
    {#if mapState === "community"}
      {@html i18n("Find Routes Instructions")}
    {:else}
      {@html i18n("Select Route Instructions")}
    {/if}
  </fieldset>
  {/if}
  <fieldset class="closures">
    <legend
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24px"
        height="24px"
        ><path
          d="M 12 2 C 6.4889971 2 2 6.4889971 2 12 C 2 17.511003 6.4889971 22 12 22 C 17.511003 22 22 17.511003 22 12 C 22 6.4889971 17.511003 2 12 2 z M 12 4 C 16.430123 4 20 7.5698774 20 12 C 20 16.430123 16.430123 20 12 20 C 7.5698774 20 4 16.430123 4 12 C 4 7.5698774 7.5698774 4 12 4 z M 11 7 L 11 9 L 13 9 L 13 7 L 11 7 z M 11 11 L 11 17 L 13 17 L 13 11 L 11 11 z"
        /></svg
      >&nbsp;{i18n("Please note")}</legend
    >
    {#if mapState === "community"}
      {@html i18n("Closures")}
    {:else}
      {@html i18n("Closures")}
    {/if}
  </fieldset>
</div>
