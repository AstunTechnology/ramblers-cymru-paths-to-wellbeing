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
import { Style, Stroke } from 'ol/style';

import OlLayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';


class PathsToWellbeingMap {
  constructor(options) {
    this.lang = options.lang || 'en';
    this.translations = options.translations;

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
        url: '/static/data/route_' + this.lang + '.geojson'
      }),
      style: function(feature, resolution){
        let color = 'rgba(0,0,0,1.0)';
        switch (feature.get('difficulty')) {
            case 'Easy Access':
                color = 'rgba(35,200,35,1.0)';
                break;
            case 'Leisurely':
                color = 'rgba(35,35,200,1.0)';
                break;
            case 'Easy':
                color = 'rgba(35,200,200,1.0)';
                break;
            case 'Moderate':
                color = 'rgba(200,200,35,1.0)';
                break;
            case 'Strenuous':
                color = 'rgba(200,35,35,1.0)';
                break;
        }
        return new Style({
            stroke: new Stroke({
                color: color,
                width: 0
            })
        });
      }
    });

    this.areaLyr = new VectorLayer({
      title: this.i18n('areas'),
      source: new VectorSource({
        format: new TopoJSON(),
        url: '/static/data/area.topojson'
      })
    });

    this.map = new Map({
      target: options.target,
      controls,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.areaLyr,
        this.routeLyr
      ],
      view: new View({
        center: [-421000, 6877000],
        zoom: 8,
      }),
    });
    
    this.layerSwitcher = new OlLayerSwitcher({
      reverse: true,
      groupSelectStyle: 'group'
    });
    this.map.addControl(this.layerSwitcher);
    
    this.popup = new Popup();
    this.map.addOverlay(this.popup);
    this.map.on('singleclick', (evt) => this.displayPopup(evt));
  }

  displayPopup(evt) {
    let popupText = '<ul>';
    this.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
      let keys = feature.getKeys();
      popupText += '<li><table>';
      for (let i=0; i<keys.length; i++) {
        if (keys[i] != 'geometry') {
          let popupField = '';
          popupField += '<th>' + keys[i] + ':</th><td>';
          popupField += (feature.get(keys[i]) != null ? feature.get(keys[i]).toLocaleString() + '</td>' : '');
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
