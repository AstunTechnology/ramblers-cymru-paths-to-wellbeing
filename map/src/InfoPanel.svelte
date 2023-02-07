<script>
  import { Feature } from "ol";
  import MultiLineString from "ol/geom/MultiLineString";
  import { transform as transformCoord } from "ol/proj";
  import { createEventDispatcher } from "svelte";
  import slugify from "@sindresorhus/slugify";

  const dispatch = createEventDispatcher();

  export let staticUrl = "";
  export let lang = "en";
  export let i18n = (key) => key;
  export let route = defaultRoute();
  let pathClass, classField, statsClass;

  export function setRoute(route_, selectedFilter) {
    if (route_) {
      console.log(route_);
      route = route_;
    } else {
      route = defaultRoute();
    }
    if (selectedFilter == "Route difficulty") {
      pathClass = "difficulty";
      classField = "difficultyuid";
    } else {
      pathClass = "familyfriendly";
      classField = "family_friendly";
    }
    statsClass = `${pathClass}-${route.get(classField)}`;
  }

  $: startCoord = transformCoord(
    route.getGeometry().getFirstCoordinate(),
    "EPSG:3857",
    "EPSG:4326"
  );

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
      geometry: new MultiLineString([[[0, 0]]]),
    });
  }

  function onCloseClick(evt) {
    dispatch("close", { route });
  }
</script>

<div class="panel-content info-panel">
  <header>
    <p>{route.get("community")}</p>
    <div>
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
      ></div>
      <p>{route.get("tagline")}</p>
  </header>
  <table class="stats {statsClass}">
    <tr>
      <th>{i18n("Difficulty")}:</th><td>{route.get("difficulty")}</td>
      <th>{i18n("Distance")}:</th><td
        >{Math.round((route.get("length") / 1.609) * 100) / 100}
        {i18n("miles")}</td
      >
    </tr>
    <tr>
      <th>{i18n("Shape")}:</th><td>{route.get("shape")}</td>
      <th>{i18n("average_walk_time")}:</th><td
        >{route.get("avg_walk_time")}
        {i18n("time_format")}</td>
    </tr>
    <tr>
      <th>{i18n("condition")}:</th>
      <td colspan="3">{route.get("paths")}</td>
    </tr>
  </table>
  <div class="download">
    <a
      href="{staticUrl}guide/route_{route.get('routeuid')}.pdf"
      download="{slugify(route.get('name'))}.pdf"
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
      {i18n("Download Route Guide")}</a
    >
    <a
      href="{staticUrl}gpx/route_{route.get('routeuid')}_{lang}.gpx"
      download="{slugify(route.get('name'))}-{lang}.gpx"
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
    <a
      href="{staticUrl}community/{route.get('community_id')}.pdf"
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
      {i18n("Download Community Routes Guide")}</a
    >
    <a
      href="https://www.google.com/maps/dir/?api=1&destination={startCoord[1]},{startCoord[0]}"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="21"
        style="width: 21px"
        viewBox="0 0 232597 333333"
        shape-rendering="geometricPrecision"
        text-rendering="geometricPrecision"
        image-rendering="optimizeQuality"
        fill-rule="evenodd"
        clip-rule="evenodd"
        ><path
          d="M151444 5419C140355 1916 128560 0 116311 0 80573 0 48591 16155 27269 41534l54942 46222 69232-82338z"
          fill="#1a73e8"
        /><path
          d="M27244 41534C10257 61747 0 87832 0 116286c0 21876 4360 39594 11517 55472l70669-84002-54942-46222z"
          fill="#ea4335"
        /><path
          d="M116311 71828c24573 0 44483 19910 44483 44483 0 10938-3957 20969-10509 28706 0 0 35133-41786 69232-82313-14089-27093-38510-47936-68048-57286L82186 87756c8166-9753 20415-15928 34125-15928z"
          fill="#4285f4"
        /><path
          d="M116311 160769c-24573 0-44483-19910-44483-44483 0-10863 3906-20818 10358-28555l-70669 84027c12072 26791 32159 48289 52851 75381l85891-102122c-8141 9628-20339 15752-33948 15752z"
          fill="#fbbc04"
        /><path
          d="M148571 275014c38787-60663 84026-88210 84026-158728 0-19331-4738-37552-13080-53581L64393 247140c6578 8620 13206 17793 19683 27900 23590 36444 17037 58294 32260 58294 15172 0 8644-21876 32235-58320z"
          fill="#34a853"
        /></svg
      >
      {i18n("Google Directions")}</a
    >
  </div>
  <img
    src="{staticUrl}photo/route_{route.get('routeuid')}.jpg"
    class="photo"
    alt={route.get("name")}
  />
</div>
