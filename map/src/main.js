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
import CircleStyle from 'ol/style/Circle';

import OlLayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';

import { makeCommunitySource } from './community.js';
import { difficultyColours } from './config.js';
import InfoPanel from './InfoPanel.svelte';
import FilterPanel from './FilterPanel.svelte';

class PathsToWellbeingMap {
  constructor(options) {
    this.lang = options.lang || 'en';
    this.staticUrl = options.staticUrl;
    this.translations = options.translations;
    this.panels = {};
    this.containerElm = this.buildUi(options.target);
    this.showPanel('filter');

    this.state = 'overview';

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
    });

    // Initially defined without a source, the source is created once
    // the routes have loaded
    this.communityLyr = new VectorLayer({
      // No title property is required as we don't need to display in the
      // the layer in the layer switcher
      title: this.i18n('communities'),
      style: (feature, resolution) => {
        if (this.state == 'overview') {
          console.log('Community', this.state);
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
              font: '16px Rucksack',
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
        } else {
          return new Style({
            radius: 0,
          });
        }
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
      this.state = 'community';
      this.routeLyr.changed();
    });

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
      // console.log(evt.detail.route);
      // TODO Show the default filter panel, clear route selection etc.
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
    if (this.state == 'overview') {
      return;
    } else if (this.state != 'displayRoutes') {
      this.hoverRouteUid.length = 0;
      this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // console.log('LAYER: ', layer.get('title'));
        if (layer.get('title') == this.i18n('paths')) {
          this.hoverRouteUid.push(feature.get('routeuid'));
        }
      });
      this.routeLyr.changed();
    }
  }

  handleMapClick(evt) {
    // Which function is called will depend on both map state and which layer was clicked
    console.log('STATE:', this.state);
    this.clickRouteUid.length = 0;
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer === this.communityLyr) {
        this.state = 'community';
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
      let route = this.getRouteByRouteUid(routeUid);
      this.displayRouteInfo(route);
    }
  }

  displayPopup(evt) {
    let popupText = '<ul>';
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer.get('title') == this.i18n('paths')) {
        popupText +=
          '<li><a href="#" data-routeuid="' + feature.get('routeuid') + '">';
        popupText += feature.get('name');
        popupText += '</a></li>';
        this.state = 'displayRoutes';
      }
    });
    popupText += '</ul>';
    this.popup.show(evt.coordinate, popupText);
  }

  displayRouteInfo(route) {
    this.infoPanel.setRoute(route);
    this.showPanel('info');
  }

  routeStyle(feature, resolution) {
    // console.log('STATE', this.state);
    if (this.state == 'overview') {
      return new Style({
        stroke: null,
      });
    } else if (this.state == 'community' || this.state == 'displayRoutes') {
      if (this.hoverRouteUid.includes(feature.get('routeuid'))) {
        return [
          this.startPointStyle(feature),
          ...this.routeHighlightStyle,
          this.routeDifficultyStyle(feature),
        ];
      } else {
        return [
          this.startPointStyle(feature),
          this.routeDifficultyStyle(feature),
        ];
      }
    } else {
      return this.routeDifficultyStyle(feature);
    }
    this.hoverRouteUid = [];
  }

  startPointStyle(feature) {
    return new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: 'white',
        }),
        stroke: new Stroke({
          color: 'blue',
          width: 2,
        }),
      }),
      geometry: function (feature) {
        // return the coordinates of the first ring of the polygon
        const coordinates = feature.getGeometry().getFirstCoordinate();
        return new Point(coordinates);
      },
    });
  }

  routeDifficultyStyle(feature) {
    return new Style({
      stroke: new Stroke({
        color: difficultyColours[feature.get('difficulty')],
        width: 5,
      }),
    });
  }

  routeHighlightStyle = [
    new Style({
      stroke: new Stroke({
        color: 'black',
        width: 11,
      }),
    }),
    new Style({
      stroke: new Stroke({
        color: 'white',
        width: 9,
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
