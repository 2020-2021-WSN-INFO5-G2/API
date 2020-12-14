const axios = require('axios');
require('dotenv').config();
let data = [
    {
        gtw_id: 'eui-904d4afffeff4c03',
        timestamp: 1572443659,
        time: '2020-12-14T09:22:41.039001Z',
        antenna: 1,
        channel: 0,
        rssi: -119,
        snr: -4,
        rf_chain: 0,
        latitude: 45.19071,
        longitude: 5.73685,
        altitude: 250
      },
      {
        gtw_id: 'eui-904d4afffeff4d8e',
        timestamp: 4264134587,
        time: '2020-12-14T09:22:41.039Z',
        antenna: 1,
        channel: 0,
        rssi: -115,
        snr: 0,
        rf_chain: 0,
        latitude: 45.1854,
        longitude: 5.74262,
        altitude: 248
      }];

let gateways = [], frames = [];

data.forEach(element => {
    gateways.push({"gatewayId": element.gtw_id, "latitude": element.latitude, "longitude": element.longitude, "altitude": element.altitude})
    frames.push([element.gtw_id, element.antenna || null, element.timestamp || null, element.rssi, element.snr])
});

const request = axios({
    method: 'post',
    url: 'https://gls.loracloud.com/api/v3/solve/singleframe',
    headers: {
        'Accept': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.LORACLOUD_KEY
    },
    data: {
      gateways: gateways,
      frame: frames,
      params: {
        "locAlgType": "RSSI_ALG",  // "TDOA_ALG" or "RSSI_ALG"
        "doRssiTdoaCombine": true
      }      
    }
});

request.then(function (response) {
    // handle success
    //console.log(response);
    console.log(response.data.result)
    console.log("http://geojson.io/#data=data:application/json,"+ encodeURIComponent(JSON.stringify({
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Point",
              "coordinates": [
                response.data.result.locationEst.longitude,
                response.data.result.locationEst.latitude
              ]
            }
          }
        ]
      })))
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
