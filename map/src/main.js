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
import MultiPoint from 'ol/geom/MultiPoint';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';
import CircleStyle from 'ol/style/Circle';

import OlLayerSwitcher from 'ol-layerswitcher';
import Popup from 'ol-popup';

import { makeCommunitySource } from './community.js';
import { difficultyColours } from './config.js';

class PathsToWellbeingMap {
  constructor(options) {
    this.lang = options.lang || 'en';
    this.translations = options.translations;

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
        url: '/static/data/route_' + this.lang + '.geojson',
      }),
      style: (feature, resolution) => {
        if (this.state == 'overview') {
          return new Style({
            stroke: new Stroke({
              color: 'rgba(0,0,0,0)',
              width: 2,
            }),
          });
        } else if (this.state == 'community') {
          return [
            new Style({
              image: new CircleStyle({
                  radius: 5,
                fill: new Fill({
                  color: 'white',
                }),
                stroke: new Stroke({
                  color: 'blue',
                  width: 2
                })
              }),
              geometry: function (feature) {
                // return the coordinates of the first ring of the polygon
                const coordinates = feature.getGeometry().getFirstCoordinate();
                console.log(coordinates);
                return new MultiPoint(coordinates);
              },
            }),
            new Style({
              stroke: new Stroke({
                color: difficultyColours[feature.get('difficulty')],
                width: 2,
              }),
            })
          ]
        } else {
          return new Style({
            stroke: new Stroke({
              color: difficultyColours[feature.get('difficulty')],
              width: 2,
            }),
          });
        }
      },
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
                color: 'rgba(255,255,255,0.4)',
              }),
              stroke: new Stroke({
                color: '#3399CC',
                width: 1.25,
              }),
              radius: 5,
            }),
            text: new Text({
              text: feature.get('name'),
              font: '16px sans-serif',
              textAlign: 'left',
              offsetX: 10
            })
          })
        } else {
          return new Style({
            radius: 0,
          })
        }
      }
    });

    this.routeLyr.getSource().on('featuresloadend', (evt) => {
      let communitySrc = makeCommunitySource(evt.target);
      this.communityLyr.setSource(communitySrc);
    });

    this.areaLyr = new VectorLayer({
      title: this.i18n('areas'),
      source: new VectorSource({
        format: new TopoJSON(),
        url: '/static/data/area.topojson',
      }),
    });

    this.map = new Map({
      target: options.target,
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
    this.map.on('singleclick', (evt) => this.handleMapClick(evt));
  }

  handleMapClick(evt) {
    // Which function is called will depend on both map state and which layer was clicked
    console.log('STATE:', this.state);
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      console.log('LAYER: ', layer.get('title'));
      if (layer.get('title') == 'Communities') {
        this.state = 'community';
        this.map.getView().fit( 
          feature.getGeometry(),
          {duration: 1000}
        );
        this.communityLyr.changed();
        this.routeLyr.changed();
      }
    })
  }
  
  displayPopup(evt) {
    let popupText = '<ul>';
    this.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
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
