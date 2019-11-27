import { Component, OnInit } from '@angular/core';
import 'node_modules/leaflet-choropleth/dist/choropleth.js'
import { StoreService } from '../store.service';
import * as $ from 'jquery';
import Chart from 'chart.js';

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
  median: number;
  max = 0;

  constructor(private store: StoreService) {

  }

  convertTOGeoJSON(polygons) {
    let features = [];
    let totalValues = [];

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
        });

        this.max = this.max < polygon.value ? polygon.value : this.max;

        totalValues.push(polygon.value);
      }
    }

    this.computeMedian(totalValues);
    return {
      "type": "FeatureCollection",
      "features": features
    }

  }

  computeMedian(values) {
    values.sort((a, b) => a - b);
    let lowMiddle = Math.floor((values.length - 1) / 2);
    let highMiddle = Math.ceil((values.length - 1) / 2);
    this.median = (values[lowMiddle] + values[highMiddle]) / 2;
  }

  ngOnInit() {

    var maxBounds = [
      [80.499550, -167.276413], //Southwest
      [-5.162102, -2.233040]  //Northeast
    ];

    this.map = L.map('mapid', {
      'maxBounds': maxBounds
    }).setView([-104.4480126008, 50.7736985613], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 3,
      maxZoom: 6
    }).addTo(this.map);


    const formData = new FormData();
    formData.append('past_year', $("#year").val());
    formData.append('past_week', $("#week").val());

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
      this._div.innerHTML = '<h6>Fishing Vessel Density Range</h6><div><canvas id="doughchartContainer" style="height: 170px; width: 210px;"></canvas></div>';
    };

    info.addTo(map);

    var geojsonLayer;

    geojsonLayer = L.choropleth(this.geojsonData, {
      valueProperty: 'density', // which property in the features to use
      scale: ['white', 'red'], // chroma.js scale - include as many as you like
      steps: 5, // number of breaks or steps in range
      mode: 'q', // q for quantile, e for equidistant, k for k-means
      style: {
        color: '#fff', // border color
        weight: 2,
        fillOpacity: 0.8
      },
      onEachFeature: onEachFeature
    }).addTo(map)

    info.update({ median: this.median });

    this.drawDoughnut();

    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: ((e) => {
          var layer = e.target;

          layer.setStyle({
            weight: 2,
            color: '#aaa',
            dashArray: '',
            fillOpacity: 0.8
          });

          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
          }
        }),
        mouseout: ((e) => {
          geojsonLayer.resetStyle(e.target);
        })
      });
      layer.bindPopup('Density: ' + feature.properties.density);
    }
  }

  drawDoughnut() {
    var ctx = $("#doughchartContainer");
    let median = this.median;
    let max = this.max;
    let doughColor = '#ffc107';

    if ((median / max) < 25) {
      doughColor = "#28a745";
    }
    else if ((median / max) > 70) {
      doughColor = "#dc3545";
    }
    var myPieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Median', 'Max'],
        datasets: [{
          label: '# of Votes',
          data: [this.median, this.max],
          backgroundColor: [
            doughColor
          ],
          //cutoutPercentage : ,
          borderWidth: 5
        }]
      }
    });
  }


}
