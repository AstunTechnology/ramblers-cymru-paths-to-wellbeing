<script>
  import { createEventDispatcher } from "svelte";

  export let i18n = (key) => key;
</script>

<main class="panel-content filter-panel">
  <header>
    <h1>{i18n("Find Routes")}</h1>
  </header>
  <form>
    <!-- Family Friendly Filter here... -->
  </form>
  {@html i18n('Find Routes Instructions')}
</main>
