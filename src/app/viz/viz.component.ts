import { Component, OnInit } from '@angular/core';
import 'node_modules/leaflet-choropleth/dist/choropleth.js'
import { StoreService } from '../store.service';

declare let L;

@Component({
  selector: 'app-viz',
  templateUrl: './viz.component.html',
  styleUrls: ['./viz.component.scss']
})
export class VizComponent implements OnInit {

  geojsonData: any;
  map: any;
  year: number;
  week: number;

  constructor(private store: StoreService) {

  }

  convertTOGeoJSON(polygons) {
    let features = [];

    for (var i = 0; i < polygons.result.length; i++) {
      let polygon = polygons.result[i];
      if (polygon.value > 0) {
        let properties = { density: polygon.value };
        let geometry = {
          "type": "Polygon",
          "coordinates": [[[polygon.lon1, polygon.lat1], [polygon.lon2, polygon.lat2], [polygon.lon3, polygon.lat3], [polygon.lon4, polygon.lat4]]]
        }
        features.push({
          "type": "Feature",
          properties,
          geometry
        })
      }
    }

    return {
      "type": "FeatureCollection",
      "features": features
    }

  }

  ngOnInit() {
    this.map = L.map('mapid').setView([52.00118, -87.359296], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const formData = new FormData();
    formData.append('past_year', 2012);
    formData.append('past_week', 1);


    this.store.post('/visualise_past_data', formData).subscribe((res) => {

      this.geojsonData = this.convertTOGeoJSON(res);
      this.initMap();
    });
  }

  initMap() {
    var map = this.map;
    var info = L.control();

    info.onAdd = function(map) {
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      this.update();
      return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function(props) {
      this._div.innerHTML = '<h4>Fishing Vessel Density</h4>' + (props ?
        '<b>' + props.density + '</b>'
        : 'Hover over a polygon');
    };

    info.addTo(map);

    L.choropleth(this.geojsonData, {
      valueProperty: 'density', // which property in the features to use
      scale: ['white', 'red'], // chroma.js scale - include as many as you like
      steps: 5, // number of breaks or steps in range
      mode: 'q', // q for quantile, e for equidistant, k for k-means
      style: {
        color: '#fff', // border color
        weight: 2,
        fillOpacity: 0.8
      },
      onEachFeature: function(feature, layer) {
        layer.on({
          mouseover: ((e) => {
            var layer = e.target;

            layer.setStyle({
              weight: 5,
              color: '#666',
              dashArray: '',
              fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              layer.bringToFront();
            }

            info.update(layer.feature.properties);
          }),
          mouseout: ((e) => {
            geojsonLayer.resetStyle(e.target);
            info.update();
          })
        });
        layer.bindPopup('Density ' + feature.properties.density);
      }
    }).addTo(map)
  }

}
