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

import Popup from 'ol-popup';

import { difficultyColours, Tooltip } from './config.js';
import InfoPanel from './InfoPanel.svelte';
import FilterPanel from './FilterPanel.svelte';

const DISPLAY_COMMUNITY_UNTIL_RES = 150;
const FIT_OPTIONS = { duration: 1000, padding: [20, 20, 20, 20] };

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
      maxResolution: DISPLAY_COMMUNITY_UNTIL_RES,
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + 'route_' + this.lang + '.geojson',
      }),
      style: (feature, resolution) => this.routeStyle(feature, resolution),
      opacity: 0.75,
    });

    this.communityLyr = new VectorLayer({
      title: this.i18n('communities'),
      minResolution: DISPLAY_COMMUNITY_UNTIL_RES,
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + 'community_' + this.lang + '.geojson',
      }),
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
          })
        })
      }
    });

    this.labelLyr = new VectorLayer({
      title: 'labels',
      minResolution: DISPLAY_COMMUNITY_UNTIL_RES,
      source: new VectorSource({
        format: new GeoJSON(),
        url: this.staticUrl + 'community_' + this.lang + '.geojson',
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
            text: feature.get('name'),
            font: '16px Rucksack',
            fill: new Fill({
              color: '#333',
            }),
            textAlign: feature.get('textalign'),
            offsetX: feature.get('offsetx'),
            offsetY: feature.get('offsety'),
            stroke: new Stroke({
              color: '#eee',
              width: 6,
            }),
          }),
        })
      }
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
        this.labelLyr,
      ],
      view: new View({
        center: [-421000, 6877000],
        zoom: 8,
      }),
    });

    this.popup = new Popup();
    this.map.addOverlay(this.popup);
    this.popup.getElement().addEventListener('click', (evt) => {
      this.handlePopupClick(evt);
    });
    this.popup.closer.addEventListener('click', () => {
      this.clickRouteUid = [];
    });

    this.tooltip = new Tooltip();
    this.map.addOverlay(this.tooltip);

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
      if (layer == this.communityLyr) {
        this.tooltip.show(
          evt.coordinate,
          `Zoom to ${feature.get('name')} routes`
        );
      } else {
        this.tooltip.hide();
      }
    });
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
          '<li class="pathDifficulty-' + feature.get('difficulty').replace(/ /g, '') + '"><div><a href="#" data-routeuid="' + feature.get('routeuid') + '">';
        popupText += feature.get('name');
        popupText += '</a></div>'
        popupText += '<div><div class="distance"><div class="material-icons">hiking</div> ' + feature.get('length').toFixed(1) + 'km</div>'
        popupText += '<div class="ascent"><div class="material-icons">trending_up</div> ' + feature.get('total_ascent') + 'm</div></div></li>';
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
      .fit(route.getGeometry(), FIT_OPTIONS);
    this.selectedRoute = route;
    this.routeLyr.changed();
  }

  routeStyle(feature, resolution) {
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
