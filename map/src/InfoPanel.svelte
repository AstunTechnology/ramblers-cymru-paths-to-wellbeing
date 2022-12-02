<script>
  import { Feature } from "ol";
  import { createEventDispatcher } from "svelte";
  import slugify from "@sindresorhus/slugify";

  export let staticUrl = "";
  export let lang = "en";
  export let i18n = (key) => key;
  export let route = defaultRoute();
  export function setRoute(route_) {
    if (route_) {
      route = route_;
    } else {
      route = defaultRoute();
    }
  }

  const dispatch = createEventDispatcher();

  function defaultRoute() {
    return new Feature({
      name: "-",
      routeuid: null,
      routesummary: "-",
      community: "-",
      difficulty: "-",
      shape: "-",
      length: null,
      total_ascent: null,
    });
  }

  function onCloseClick(evt) {
    dispatch("close", { route });
  }
</script>

<main class="panel-content info-panel">
  <header>
    <h1>{route.get("name")}</h1>
    <button on:click={onCloseClick}
      ><svg
        width="20px"
        height="20px"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        ><title>{i18n("Close route information")}</title><path
          d="M289.94,256l95-95A24,24,0,0,0,351,127l-95,95-95-95A24,24,0,0,0,127,161l95,95-95,95A24,24,0,1,0,161,385l95-95,95,95A24,24,0,0,0,385,351Z"
        /></svg
      ></button
    >
  </header>
  <table class="stats">
    <tr>
      <th>{i18n("Difficulty")}:</th><td>{route.get("difficulty")}</td>
      <th>{i18n("Distance")}:</th><td
        >{Math.round((route.get("length") / 1.609) * 100) / 100}
        {i18n("miles")}</td
      >
    </tr>
    <tr>
      <th>{i18n("Shape")}:</th><td>{route.get("shape")}</td>
      <th /><td />
    </tr>
  </table>
  <p>{route.get("routesummary")}</p>
  <div class="download">
    <a
      href="{staticUrl}guide/route_{route.get("routeuid")}.pdf"
      download={slugify(route.get('name'))}.pdf
      ><svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000"
        stroke-width="2"
        stroke-linecap="square"
        stroke-linejoin="arcs"
        ><path
          d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"
        /></svg
      >
      {i18n("Download Route Guild")}</a
    >
    <a
      href="{staticUrl}gpx/route_{route.get("routeuid")}_{lang}.gpx"
      download={slugify(route.get('name'))}-{lang}.gpx
      ><svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#000"
        stroke-width="2"
        stroke-linecap="square"
        stroke-linejoin="arcs"
        ><path
          d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"
        /></svg
      >
      {i18n("Download GPX")}</a
    >
  </div>
  <img src="{staticUrl}photo/route_{route.get('routeuid')}.jpeg" class="photo" alt="{route.get('name')}" />
</main>
