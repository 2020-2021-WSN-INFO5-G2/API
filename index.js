import { data } from 'ttn';
import dotenv from 'dotenv';
import express from 'express';
import cors from "cors";
import bodyParser from "body-parser";
import axios from 'axios';

dotenv.config();

var app = express();
app.disable('x-powered-by')
app.use(cors());
app.use(bodyParser.json());
const appID = process.env.APPID;
const accessKey = process.env.ACCESS_KEY;
const port = process.env.PORT || 3000;

let frames = {
  "devCartan": [{
    "app_id": "explorer-sherlock",
    "dev_id": "devCartan",
    "hardware_serial": "00FF3E80F4AE3F52",
    "port": 4,
    "counter": 2,
    "payload_raw": {
      "type": "Buffer",
      "data": [19, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    "metadata": {
      "time": "2020-12-07T19:29:46.717214946Z",
      "frequency": 868.5,
      "modulation": "LORA",
      "data_rate": "SF9BW125",
      "airtime": 246784000,
      "coding_rate": "4/5",
      "gateways": [
        {
          "gtw_id": "eui-3535303229007200",
          "timestamp": 3067929442,
          "time": "",
          "channel": 2,
          "rssi": -59,
          "snr": 7.5,
          "rf_chain": 0
        },
        {
          "gtw_id": "eui-904d4afffeff4d8e",
          "timestamp": 2824818076,
          "time": "2020-12-07T19:29:45.666326Z",
          "antenna": 1,
          "channel": 3,
          "rssi": -113,
          "snr": -9.8,
          "rf_chain": 0,
          "latitude": 45.18541,
          "longitude": 5.74257,
          "altitude": 251
        },
        {
          "gtw_id": "eui-904d4afffeff4dd3",
          "timestamp": 1123636204,
          "time": "2020-12-07T19:29:45.666323Z",
          "channel": 7,
          "rssi": -117,
          "snr": -6,
          "rf_chain": 0,
          "latitude": 45.1709,
          "longitude": 5.74149,
          "altitude": 246
        }]
    },
    "payload": {
      "type": "Buffer",
      "data": [19, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    "_msgid": "4e8cc0ac.df478"
  }]
};


const main = async function () {
  const client = await data(appID, accessKey)

  app.get('/', function (req, res) {
    res.send('hello world');

  });

  app.get('/devices/:device([a-z\-\_]+)', (req, res) => {
    if (frames[req.params.device] === undefined) {
      res.status(404)
      res.send("Device not found")
    } else {
      res.status(200)
      res.contentType('json')
      res.send(JSON.stringify(frames[req.params.device]))
    }
  });

  app.post('/devices/:device([a-z\-\_]+)', (req, res) => {
    if (req.body.ledstatus === undefined) {
      res.status(400)
      res.send("You must specify what to do with the LED")
    } else if (frames[req.params.device] === undefined) {
      res.status(404)
      res.send("Device not found")
    } else {
      client.send(req.params.device, Buffer.from([0x0f, req.body.ledstatus ? 0x01 : 0x00]))
      res.status(200)
      res.send("Instruction send to device")
    }
  });

  app.post('/loracloud/singleframe', (req, res) => {
    if (!req.body.gateways || !req.body.frames || !req.body.device || !req.header("Ocp-Apim-Subscription-Key")) {
      res.status(400)
      if (!req.body.gateways)
        res.send("Error, Missing Gateways")
      if (!req.body.frames)
        res.send("Error, Missing Frames")
      if (!req.body.frames)
        res.send("Error, Missing Device name")
      if (!req.header("Ocp-Apim-Subscription-Key"))
        res.send("Error, Missing API Key")
    } else {
      const request = axios({
        method: 'post',
        url: 'https://gls.loracloud.com/api/v3/solve/singleframe',
        headers: {
          'Accept': 'application/json',
          'Ocp-Apim-Subscription-Key': req.header("Ocp-Apim-Subscription-Key")
        },
        data: {
          gateways: req.body.gateways,
          frame: req.body.frames,
          params: {
            "locAlgType": "RSSI_ALG",  // "TDOA_ALG" or "RSSI_ALG"
            "doRssiTdoaCombine": true
          }
        }
      });

      request.then(function (response) {
        // handle success
        //console.log(response);
        console.log(response.data)
        res.status(200)
        res.contentType('json')

        res.send(JSON.stringify({
          "name": req.body.device,
          "coordinates": {
            "longitude": response.data.result.locationEst.longitude,
            "latitude": response.data.result.locationEst.latitude
          }
        }
        ))
      })
        .catch(function (error) {
          res.send(error)
          console.log(error);
        })
    }
  })

  client
    .on("uplink", function (devID, payload) {
      console.log("Received uplink from ", devID)
      console.log(payload)
      if (frames[devID] === undefined)
        frames[devID] = []
      frames[devID].push(payload)
      if (frames[devID].length > 5)
        frames[devID].shift()
    })
}

main().catch(function (err) {
  console.error(err)
})

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`)
})