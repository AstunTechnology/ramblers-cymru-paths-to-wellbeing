<script>
  import { createEventDispatcher } from "svelte";
  import AutoComplete from "simple-svelte-autocomplete";

  export let i18n = (key) => key;
  export let lang = "en";

  const dispatch = createEventDispatcher();

  async function getItems(keyword) {
    let url = "https://ws.geonames.net/searchJSON?username=ramblers";
    // adminCode1 WLS is Wales
    url += "&country=GB&adminCode1=WLS&lang=" + lang;
    // As per http://www.geonames.org/export/codes.html
    // P city, village,...
    // R road, railroad
    url += "&featureClass=P&featureClass=R";
    url +=
      "&style=FULL&maxRows=25&name_startsWith=" + encodeURIComponent(keyword);
    const response = await fetch(url);
    const json = await response.json();
    return json.geonames;
  }

  function labelFunction(result) {
    let label = result.name;
    if (result.adminName2) {
      label += ` (${result.adminName2})`;
    }
    return label;
  }

  function onChange(evt) {
    dispatch("select", { result: evt });
  }
</script>

<main class="gazetteer">
  <!-- Pass additional attributes via restProps which are applied
       to the input by simple-svelte-autocomplete -->
  <AutoComplete
    {onChange}
    placeholder={i18n("gazetteer_placeholder")}
    searchFunction={getItems}
    delay="1000"
    localFiltering={false}
    {labelFunction}
    valueFieldName="id"
    {...{ spellcheck: "false" }}
  />
</main>
