import './map.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import 'ol-popup/src/ol-popup.css';

import { Map, View, Feature } from 'ol';
import { defaults as controlDefaults } from 'ol/control/defaults';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import TopoJSON from 'ol/format/TopoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Point from 'ol/geom/Point';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';

import OlLayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';

import { makeCommunitySource } from './community.js';
import { difficultyColours } from './config.js';
import InfoPanel from './InfoPanel.svelte';
import FilterPanel from './FilterPanel.svelte';

const DISPLAY_COMMUNITY_UNTIL_RES = 150;

class PathsToWellbeingMap {
  constructor(options) {
    this.lang = options.lang || 'en';
    this.staticUrl = options.staticUrl;
    this.translations = options.translations;

    this.panels = {};
    this.containerElm = this.buildUi(options.target);
    this.showPanel('filter');

    const controls = controlDefaults({
      rotate: false,
      zoomOptions: {
        zoomInTipLabel: this.i18n('zoom_in'),
        zoomOutTipLabel: this.i18n('zoom_out'),
      },
    });

    this.routeLyr = new VectorLayer({
      title: this.i18n('paths'),
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + 'route_' + this.lang + '.geojson',
      }),
      style: (feature, resolution) => this.routeStyle(feature, resolution),
      opacity: 0.75,
    });

    // Initially defined without a source, the source is created once
    // the routes have loaded
    this.communityLyr = new VectorLayer({
      // No title property is required as we don't need to display in the
      // the layer in the layer switcher
      title: this.i18n('communities'),
      minResolution: DISPLAY_COMMUNITY_UNTIL_RES,
      style: (feature, resolution) => {
        return new Style({
          geometry: feature.getGeometry().getInteriorPoint(),
          image: new Circle({
            fill: new Fill({
              color: 'white',
            }),
            stroke: new Stroke({
              color: '#3399CC',
              width: 4,
            }),
            radius: 10,
          }),
          text: new Text({
            text: feature.get('name'),
            font: '12px Rucksack',
            fill: new Fill({
              color: '#333',
            }),
            textAlign: 'left',
            offsetX: 20,
            stroke: new Stroke({
              color: '#eee',
              width: 6,
            }),
          }),
        });
      },
    });

    this.routeLyr.getSource().on('featuresloadend', (evt) => {
      let communitySrc = makeCommunitySource(evt.target);
      this.communityLyr.setSource(communitySrc);
    });

    this.areaLyr = new VectorLayer({
      source: new VectorSource({
        format: new TopoJSON(),
        url: this.staticUrl + 'area.topojson',
      }),
    });

    this.map = new Map({
      target: this.mapElm,
      controls,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.areaLyr,
        this.routeLyr,
        this.communityLyr,
      ],
      view: new View({
        center: [-421000, 6877000],
        zoom: 8,
      }),
    });

    this.layerSwitcher = new OlLayerSwitcher({
      reverse: true,
      groupSelectStyle: 'group',
    });
    this.map.addControl(this.layerSwitcher);

    this.popup = new Popup();
    this.map.addOverlay(this.popup);
    this.popup.getElement().addEventListener('click', (evt) => {
      this.handlePopupClick(evt);
    });
    this.popup.closer.addEventListener('click', () => {
      this.clickRouteUid = [];
    });

    this.selectedRoute = null;
    this.hoverRouteUid = [];
    this.clickRouteUid = [];
    this.map.on('pointermove', (evt) => this.handleMapHover(evt));
    this.map.on('singleclick', (evt) => this.handleMapClick(evt));
  }

  buildUi(target) {
    this.containerElm = document.getElementById(target);
    this.containerElm.classList.add('app');
    this.panelElm = document.createElement('aside');
    this.panelElm.className = 'panel';
    this.containerElm.appendChild(this.panelElm);
    this.mapElm = document.createElement('div');
    this.mapElm.className = 'map';
    this.containerElm.appendChild(this.mapElm);
    this.infoPanel = new InfoPanel({
      target: this.panelElm,
      props: {
        staticUrl: this.staticUrl,
        i18n: (key) => this.i18n(key),
      },
    });
    this.infoPanel.$on('close', (evt) => {
      this.selectedRoute = null;
      this.routeLyr.changed();
      this.showPanel('filter');
    });
    this.panels['info'] = this.infoPanel;
    this.filterPanel = new FilterPanel({
      target: this.panelElm,
      props: {
        staticUrl: this.staticUrl,
        i18n: (key) => this.i18n(key),
      },
    });
    this.panels['filter'] = this.filterPanel;
    this.panels['filter'].default = true;
    return this.containerElm;
  }

  /**
   * Shows a single panel, hides the all others.
   */
  showPanel(name) {
    for (let panelName in this.panels) {
      let panelElm = document.querySelector(`.${panelName}-panel`);
      panelElm.classList.remove('shown');
      if (panelName == name) {
        panelElm.classList.add('shown');
      }
    }
  }

  handleMapHover(evt) {
    this.hoverRouteUid = [];
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer == this.routeLyr) {
        this.hoverRouteUid.push(feature.get('routeuid'));
      }
    });
    this.routeLyr.changed();
  }

  handleMapClick(evt) {
    this.clickRouteUid = [];
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer === this.communityLyr) {
        this.map.getView().fit(feature.getGeometry(), { duration: 1000 });
        this.communityLyr.changed();
        this.routeLyr.changed();
      }
      if (layer === this.routeLyr) {
        this.clickRouteUid.push(feature.get('routeuid'));
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
    let popupText = '<ul>';
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer === this.routeLyr) {
        popupText +=
          '<li><a href="#" data-routeuid="' + feature.get('routeuid') + '">';
        popupText += feature.get('name');
        popupText += '</a></li>';
      }
    });
    popupText += '</ul>';
    this.popup.show(evt.coordinate, popupText);
  }

  displayRouteInfo(route) {
    this.popup.hide();
    this.infoPanel.setRoute(route);
    this.showPanel('info');
    this.map
      .getView()
      .fit(route.getGeometry(), { duration: 1000, padding: [20, 20, 20, 20] });
    this.selectedRoute = route;
    this.routeLyr.changed();
  }

  routeStyle(feature, resolution) {
    // NOTE Check DISPLAY_COMMUNITY_UNTIL_RES here instead of setting
    // the minResolution of the routeLyr as OpenLayers doesn't even
    // load the GeoJSON into the source if the initial via is out
    // of bounds
    if (resolution >= DISPLAY_COMMUNITY_UNTIL_RES) {
      return new Style({
        fill: null,
      });
    }
    // Determine the route style based on whether the current route is selected
    // and if it's not whether another route is selected.
    let selected = feature === this.selectedRoute;
    let mode = 'normal';
    if (selected) {
      mode = 'selected';
    } else if (this.selectedRoute) {
      mode = 'muted';
    }
    let start = this.startPointStyle(feature, mode);
    let difficulty = this.routeDifficultyStyle(feature, mode);
    if (selected) {
      return [start, ...this.routeSelectedStyle, difficulty];
    }
    if (
      this.clickRouteUid.includes(feature.get('routeuid')) ||
      this.hoverRouteUid.includes(feature.get('routeuid'))
    ) {
      return [start, ...this.routeHighlightStyle, difficulty];
    }
    return [start, difficulty];
  }

  startPointStyle(feature, mode) {
    let opacity = mode === 'muted' ? 0.5 : 1;
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
    if (mode === 'selected') {
      style.setZIndex(1);
    }
    return style;
  }

  routeDifficultyStyle(feature, mode) {
    let opacity = mode === 'muted' ? 0.5 : 1;
    let color = `rgba(${
      difficultyColours[feature.get('difficulty')]
    },${opacity})`;
    let style = new Style({
      stroke: new Stroke({
        color,
        width: 5,
      }),
    });
    if (mode === 'selected') {
      style.setZIndex(1);
    }
    return style;
  }

  routeHighlightStyle = [
    new Style({
      stroke: new Stroke({
        color: 'yellow',
        width: 11,
      }),
    }),
  ];

  routeSelectedStyle = [
    new Style({
      zIndex: 1,
      stroke: new Stroke({
        color: 'rgba(249,177,41)',
        width: 13,
      }),
    }),
  ];

  getRouteByRouteUid(routeuid) {
    return this.routeLyr
      .getSource()
      .getFeatures()
      .find((feature) => feature.get('routeuid') == routeuid);
  }

  i18n(key) {
    try {
      return this.translations[key][this.lang];
    } catch (e) {
      console.error(`No translation found for: ${key}, ${this.lang}`);
      return '';
    }
  }
}

export { PathsToWellbeingMap };
