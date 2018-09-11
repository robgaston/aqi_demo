import "./styles.css";
import "mapbox-gl/dist/mapbox-gl.css";
import * as mapboxgl from "mapbox-gl";
import settings from "./settings.json";

const parser = new DOMParser();

mapboxgl.accessToken = settings.accessToken;

async function init(e) {
    const map = e.target;
    const aqiResponse = await fetch("http://www.baaqmd.gov/Files/Feeds/aqi_rss.xml");
    const aqiText = await aqiResponse.text()
    const aqiDOM = parser.parseFromString(aqiText, "application/xml");

    let aqiData = [];
    aqiDOM.querySelectorAll("item").forEach((item) => {
        let itemData = {
            date: item.querySelector('date').innerHTML,
            zones: []
        };
        item.querySelectorAll('zone').forEach((zone) => {
            let measurement = zone.querySelector('measurement').innerHTML;
            if (!isNaN(parseFloat(measurement))) {
                measurement = parseFloat(measurement);
            }

            itemData.zones.push({
                title: zone.querySelector('title').innerHTML,
                measurement: measurement,
                pollutant: zone.querySelector('pollutant').innerHTML
            })
        });
        aqiData.push(itemData);
    });

    const zones = ["Eastern Zone", "Coastal and Central Bay", "South Central Bay", "Northern Zone", "Santa Clara Valley"];
    function setDate(day) {
        const dayData = aqiData[day-1];
        zones.forEach((zone, i) => {
            const forecastData = dayData.zones.find((zoneData) => {
                return zoneData.title === zone;
            });
            map.setFeatureState({
                id: i+1,
                source: 'composite',
                sourceLayer: 'forecast-demo'
            }, {
                forecast: forecastData.measurement
            });
        })
    }

    document.querySelector('select').onchange = (e) => {
        const day = parseInt(e.target.value);
        setDate(day);
    };

    setDate(2);

    map.setPaintProperty('forecast-demo', 'fill-opacity', ["case",
        ["boolean", ["feature-state", "hover"], false],
        0.7,
        0.3
    ]);

    let hoveredFeature = null;
    map.on("mousemove", "forecast-demo", function(e) {
        if (e.features.length > 0) {
            if (hoveredFeature) {
                map.setFeatureState(hoveredFeature, {
                    hover: false
                });
            }
            hoveredFeature = e.features[0];
            map.setFeatureState(hoveredFeature, {
                hover: true
            });
        }
    });
}

new mapboxgl.Map(settings).on("load", init);
