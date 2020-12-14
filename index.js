import { data } from "ttn";
require('dotenv').config();

const appID = process.env.APPID
const accessKey = process.env.ACCESS_KEY

const main = async function () {
  const client = await data(appID, accessKey)

  client
    .on("uplink", function (devID, payload) {
      console.log("Received uplink from ", devID)
      console.log(payload)
      console.log(payload.metadata.gateways)
      // send downlink
      client.send(devID, Buffer.from([ 0x0f, 0xaf ]))
    })
}

main().catch(function (err) {
  console.error(err)
  process.exit(1)
})
