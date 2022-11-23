import './map.css';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import 'ol-popup/src/ol-popup.css';

import { Map, View } from 'ol';
import { defaults as controlDefaults } from 'ol/control/defaults';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import TopoJSON from 'ol/format/TopoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

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
      })
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
    
    const popup = new Popup();
    this.map.addOverlay(popup);
    this.map.on('singleclick', function(evt) {
        popup.show(evt.coordinate, '<div><h2>Click</h2><p></p></div>');
        console.log(evt);
    });
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
