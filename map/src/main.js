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
import { Circle, Fill, Stroke, Style } from 'ol/style';

import OlLayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';

import { makeCommunitySource } from './community.js';
import { difficultyColours } from './config.js';
import InfoPanel from './InfoPanel.svelte';

class PathsToWellbeingMap {
  constructor(options) {
    this.lang = options.lang || 'en';
    this.staticUrl = options.staticUrl;
    this.translations = options.translations;

    this.containerElm = this.buildUi(options.target);

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
      style: function (feature, resolution) {
        return new Style({
          stroke: new Stroke({
            color: difficultyColours[feature.get('difficulty')],
            width: 2,
          }),
        });
      },
    });

    // Initially defined without a source, the source is created once
    // the routes have loaded
    this.communityLyr = new VectorLayer({
      // No title property is required as we don't need to display in the
      // the layer in the layer switcher
      style: new Style({
        geometry: (feature) => feature.getGeometry().getInteriorPoint(),
        image: new Circle({
          fill: new Fill({
            color: 'rgba(255,255,255,0.4)',
          }),
          stroke: new Stroke({
            color: '#3399CC',
            width: 1.25,
          }),
          radius: 5,
        }),
      }),
    });

    this.routeLyr.getSource().on('featuresloadend', (evt) => {
      let communitySrc = makeCommunitySource(evt.target);
      this.communityLyr.setSource(communitySrc);
    });

    this.areaLyr = new VectorLayer({
      title: this.i18n('areas'),
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
    this.map.on('singleclick', (evt) => this.displayPopup(evt));
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
        i18n: (key) => this.i18n(key)
      }
    });
    return this.containerElm;
  }

  displayPopup(evt) {
    let popupText = '<ul>';
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      let keys = feature.getKeys();
      popupText += '<li><table>';
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] != 'geometry') {
          let popupField = '';
          popupField += '<th>' + keys[i] + ':</th><td>';
          popupField +=
            feature.get(keys[i]) != null
              ? feature.get(keys[i]).toLocaleString() + '</td>'
              : '';
          popupText += '<tr>' + popupField + '</tr>';
        }
      }
      popupText += '</table>';
    });
    popupText += '</ul>';
    this.popup.show(evt.coordinate, popupText);
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
