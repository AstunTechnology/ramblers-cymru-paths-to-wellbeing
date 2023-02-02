import "./map.css";
import "ol-layerswitcher/dist/ol-layerswitcher.css";
import "ol-popup/src/ol-popup.css";

import { Map, View, Feature } from "ol";
import { defaults as controlDefaults } from "ol/control/defaults";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from 'ol/source/XYZ';
import GeoJSON from "ol/format/GeoJSON";
import TopoJSON from "ol/format/TopoJSON";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Point from "ol/geom/Point";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import { transform as transformCoord, transformExtent } from "ol/proj";

import Popup from "ol-popup";
import LayerSwitcher from 'ol-layerswitcher';

import {
  difficultyColours,
  difficultyColoursMuted,
  familyFriendlyColours,
  familyFriendlyColoursMuted,
} from "./config.js";
import { Tooltip } from "./Tooltip.js";
import InfoPanel from "./InfoPanel.svelte";
import FilterPanel from "./FilterPanel.svelte";
import Gazetteer from "./Gazetteer.svelte";

const DISPLAY_COMMUNITY_UNTIL_RES = 150;
const FIT_OPTIONS = { duration: 1000, padding: [20, 20, 20, 20] };

class PathsToWellbeingMap {
  constructor(options) {
    this.lang = options.lang || "en";
    this.staticUrl = options.staticUrl;
    this.translations = options.translations;

    this.panels = {};
    this.containerElm = this.buildUi(options.target);
    this.showPanel("filter");

    const controls = controlDefaults({
      rotate: false,
      zoomOptions: {
        zoomInTipLabel: this.i18n("zoom_in"),
        zoomOutTipLabel: this.i18n("zoom_out"),
      },
    });

    this.routeLyr = new VectorLayer({
      maxResolution: DISPLAY_COMMUNITY_UNTIL_RES,
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + "route_" + this.lang + ".geojson",
      }),
      style: (feature, resolution) => this.routeStyle(feature, resolution),
      opacity: 0.75,
    });

    this.communityLyr = new VectorLayer({
      minResolution: DISPLAY_COMMUNITY_UNTIL_RES,
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + "community_" + this.lang + ".geojson",
      }),
      style: (feature, resolution) => {
        return new Style({
          geometry: feature.getGeometry().getInteriorPoint(),
          image: new Circle({
            fill: new Fill({
              color: "white",
            }),
            stroke: new Stroke({
              color: "#3399CC",
              width: 4,
            }),
            radius: 10,
          }),
        });
      },
    });

    this.labelLyr = new VectorLayer({
      minResolution: DISPLAY_COMMUNITY_UNTIL_RES,
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + "community_" + this.lang + ".geojson",
      }),
      style: (feature, resolution) => {
        return new Style({
          geometry: feature.getGeometry().getInteriorPoint(),
          image: new Circle({
            fill: null,
            stroke: null,
            radius: 0,
          }),
          text: new Text({
            text: feature.get("name"),
            font: "16px Rucksack",
            fill: new Fill({
              color: "#333",
            }),
            textAlign: feature.get("textalign"),
            offsetX: feature.get("offsetx"),
            offsetY: feature.get("offsety"),
            stroke: new Stroke({
              color: "#eee",
              width: 6,
            }),
          }),
        });
      },
    });

    this.borderLyr = new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + "border.geojson",
      }),
      style: new Style({
        stroke: new Stroke({
          color: "#666",
          width: 1,
        }),
      }),
    });

    this.map = new Map({
      target: this.mapElm,
      controls,
      layers: [
        new TileLayer({
          source: new OSM(),
          title: "OpenStreetMap",
          type: "base"
        }),
        new TileLayer({
          source: new XYZ({
            url: "https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=QppHDwjuIsQjcEX6HoAOcjtSX3BjCPSZ"
          }),
          title: "OS",
          type: "base"
        }),
        this.borderLyr,
        this.routeLyr,
        this.communityLyr,
        this.labelLyr,
      ],
      view: new View({
        center: [-421000, 6877000],
        zoom: 8,
        minZoom: 8,
        maxZoom: 18
      }),
    });

    this.popup = new Popup();
    this.map.addOverlay(this.popup);
    this.popup.getElement().addEventListener("click", (evt) => {
      evt.preventDefault();
      this.handlePopupClick(evt);
    });
    this.popup.closer.addEventListener("click", () => {
      this.clickRouteUid = [];
    });

    this.tooltip = new Tooltip();
    this.map.addOverlay(this.tooltip);

    const layerSwitcher = new LayerSwitcher({
      reverse: true,
      groupSelectStyle: 'group',
      startActive: true
    });
    layerSwitcher.hidePanel = function() {};
    this.map.addControl(layerSwitcher);

    this.selectedRoute = null;
    this.hoverRouteUid = [];
    this.clickRouteUid = [];
    this.map.on("pointermove", (evt) => this.handleMapHover(evt));
    this.map.on("singleclick", (evt) => this.handleMapClick(evt));

    this.selectedFilter = "Family-friendly";
    this.map.getView().on("change:resolution", (evt) => {
      const res = evt.target.getResolution();
      const mapState =
        res < DISPLAY_COMMUNITY_UNTIL_RES ? "route" : "community";
      if (mapState === "community") {
        this.clearRouteInfo();
      }
      this.filterPanel.setMapState(mapState);
    });
  }

  buildUi(target) {
    this.containerElm = document.getElementById(target);
    this.containerElm.classList.add("app");
    this.panelElm = document.createElement("aside");
    this.panelElm.className = "panel";
    this.containerElm.appendChild(this.panelElm);
    this.mapElm = document.createElement("div");
    this.mapElm.className = "map";
    this.containerElm.appendChild(this.mapElm);
    this.infoPanel = new InfoPanel({
      target: this.panelElm,
      props: {
        staticUrl: this.staticUrl,
        lang: this.lang,
        i18n: (key) => this.i18n(key),
      },
    });
    this.infoPanel.$on("close", (evt) => {
      this.clearRouteInfo();
    });
    this.panels["info"] = this.infoPanel;
    this.filterPanel = new FilterPanel({
      target: this.panelElm,
      props: {
        staticUrl: this.staticUrl,
        i18n: (key) => this.i18n(key),
      },
    });
    this.filterPanel.$on("filterChange", (evt) => {
      this.selectedFilter = evt.detail.selectedFilter;
      this.routeLyr.changed();
    });
    this.panels["filter"] = this.filterPanel;
    this.panels["filter"].default = true;
    this.filterPanel.$on("select", (evt) => {
      // TODO Extract into a method which is passed `result`
      const result = evt.detail.result;
      if (result) {
        if (result.bbox) {
          let extent = transformExtent(
            [
              result.bbox.west,
              result.bbox.south,
              result.bbox.east,
              result.bbox.north,
            ],
            "EPSG:4326",
            "EPSG:3857"
          );
          this.map.getView().fit(extent, FIT_OPTIONS);
        } else {
          let center = transformCoord(
            [result.lng, result.lat],
            "EPSG:4326",
            "EPSG:3857"
          );
          this.map.getView().animate({ center, resolution: 30 });
        }
      }
    });
    return this.containerElm;
  }

  /**
   * Shows a single panel, hides the all others.
   */
  showPanel(name) {
    for (let panelName in this.panels) {
      let panelElm = document.querySelector(`.${panelName}-panel`);
      panelElm.classList.remove("shown");
      if (panelName == name) {
        panelElm.classList.add("shown");
      }
    }
  }

  handleMapHover(evt) {
    this.hoverRouteUid = [];
    this.hovering = false;
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer == this.routeLyr) {
        this.hovering = true;
        this.hoverRouteUid.push(feature.get("routeuid"));
        this.tooltip.show(evt.coordinate, feature.get("name"));
        return true;
      } else if (layer == this.communityLyr) {
        this.hovering = true;
        this.tooltip.show(
          evt.coordinate,
          this.i18n("zoom_to") + feature.get("name") + this.i18n("routes")
        );
        return true;
      }
    });
    if (this.hovering) {
      document.querySelector("#map").classList.add("hover-pointer");
    } else {
      document.querySelector("#map").classList.remove("hover-pointer");
    }
    this.routeLyr.changed();
  }

  handleMapClick(evt) {
    this.clickRouteUid = [];
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer === this.communityLyr) {
        this.map.getView().fit(feature.getGeometry(), FIT_OPTIONS);
        this.routeLyr.changed();
      }
      if (layer === this.routeLyr) {
        this.clickRouteUid.push(feature.get("routeuid"));
        this.displayPopup(evt);
      }
    });
  }

  handlePopupClick(evt) {
    let routeUid = evt.target.dataset.routeuid;
    if (routeUid) {
      this.clickRouteUid = [];
      let route = this.getRouteByRouteUid(routeUid);
      this.displayRouteInfo(route);
    }
  }

  displayPopup(evt) {
    let pathClass;
    let classField;
    if (this.selectedFilter == "Route difficulty") {
      pathClass = "pathDifficulty";
      classField = "difficultyuid";
    } else {
      pathClass = "pathFamilyFriendly";
      classField = "family_friendly";
    }
    let popupText = "<ul>";
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer === this.routeLyr) {
        popupText +=
          '<li class="' +
          pathClass +
          "-" +
          feature.get(classField) +
          '"><div><a href="#" data-routeuid="' +
          feature.get("routeuid") +
          '">';
        popupText += feature.get("name");
        popupText += "</a></div>";
        popupText +=
          '<div><div class="distance"><img src="/static/img/icon_distance.svg" alt="Distance" /> ' +
          feature.get("length").toFixed(1) +
          "km</div>";
        popupText +=
          '<div class="time"><img src="/static/img/icon_time.svg" alt="Time" /> ' +
          feature.get("avg_walk_time") +
          "</div></div></li>";
      }
    });
    popupText += "</ul>";
    this.popup.show(evt.coordinate, popupText);
  }

  displayRouteInfo(route) {
    this.popup.hide();
    this.infoPanel.setRoute(route);
    this.showPanel("info");
    this.map.getView().fit(route.getGeometry(), FIT_OPTIONS);
    this.selectedRoute = route;
    this.routeLyr.changed();
  }

  clearRouteInfo() {
    this.showPanel("filter");
    this.selectedRoute = null;
    this.routeLyr.changed();
  }

  routeStyle(feature, resolution) {
    // Determine the route style based on whether the current route is selected
    // and if it's not whether another route is selected.
    let selected = feature === this.selectedRoute;
    let mode = "normal";
    if (
      this.clickRouteUid.includes(feature.get("routeuid")) ||
      this.hoverRouteUid.includes(feature.get("routeuid"))
    ) {
      mode = "hover";
    } else if (selected) {
      mode = "selected";
    } else if (this.selectedRoute) {
      mode = "muted";
    }
    let start = this.startPointStyle(feature, mode);
    let filterStyle;
    if (this.selectedFilter == "Route difficulty") {
      filterStyle = this.routeDifficultyStyle(feature, mode);
    } else {
      filterStyle = this.routeFamilyFriendlyStyle(feature, mode);
    }
    if (selected) {
      return [
        start,
        this.routeOutlineStyle(mode),
        this.routeSelectedStyle,
        filterStyle,
      ];
    }
    if (mode == "hover") {
      return [
        start,
        this.routeOutlineStyle(mode),
        this.routeHighlightStyle(mode),
        filterStyle,
      ];
    }
    return [start, this.routeOutlineStyle(mode), filterStyle];
  }

  startPointStyle(feature, mode) {
    let opacity = mode === "muted" ? 0.5 : 1;
    let style = new Style({
      image: new Circle({
        radius: 5,
        fill: new Fill({
          color: `rgba(255,255,255,${opacity})`,
        }),
        stroke: new Stroke({
          color: `rgba(0,0,255,${opacity})`,
          width: 2,
        }),
      }),
      geometry: function (feature) {
        // return the coordinates of the first ring of the polygon
        const coordinates = feature.getGeometry().getFirstCoordinate();
        return new Point(coordinates);
      },
    });
    if (mode === "hover") {
      style.setZIndex(2);
    } else if (mode === "selected") {
      style.setZIndex(1);
    }
    return style;
  }

  routeOutlineStyle(mode) {
    let outlineColor = mode === "muted" ? "#aaa" : "black";
    let style = new Style({
      stroke: new Stroke({
        color: outlineColor,
        width: 7,
      }),
    });
    if (mode === "hover") {
      style.setZIndex(2);
    } else if (mode === "selected") {
      style.setZIndex(1);
    }
    return style;
  }

  routeDifficultyStyle(feature, mode) {
    let colors = mode === "muted" ? difficultyColoursMuted : difficultyColours;
    let color = `rgb(${colors[feature.get("difficultyuid")]})`;
    let style = new Style({
      stroke: new Stroke({
        color,
        width: 5,
      }),
    });
    if (mode === "hover") {
      style.setZIndex(2);
    } else if (mode === "selected") {
      style.setZIndex(1);
    }
    return style;
  }

  routeFamilyFriendlyStyle(feature, mode) {
    let colors =
      mode === "muted" ? familyFriendlyColoursMuted : familyFriendlyColours;
    let color = `rgb(${colors[feature.get("family_friendly")]})`;
    let style = new Style({
      stroke: new Stroke({
        color,
        width: 5,
      }),
    });
    if (mode === "hover") {
      style.setZIndex(2);
    } else if (mode === "selected") {
      style.setZIndex(1);
    }
    return style;
  }

  routeHighlightStyle(mode) {
    let style = new Style({
      stroke: new Stroke({
        color: "white",
        width: 11,
      }),
    });
    if (mode === "hover") {
      style.setZIndex(2);
    } else if (mode === "selected") {
      style.setZIndex(1);
    }
    return style;
  }

  routeSelectedStyle = new Style({
    zIndex: 1,
    stroke: new Stroke({
      color: "yellow",
      width: 13,
    }),
  });

  getRouteByRouteUid(routeuid) {
    return this.routeLyr
      .getSource()
      .getFeatures()
      .find((feature) => feature.get("routeuid") == routeuid);
  }

  i18n(key) {
    try {
      return this.translations[key][this.lang];
    } catch (e) {
      console.error(`No translation found for: ${key}, ${this.lang}`);
      return "";
    }
  }
}

export { PathsToWellbeingMap };
