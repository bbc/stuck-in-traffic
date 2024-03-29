import crypto from 'crypto'
import { Agent } from 'undici'
import xml2js from 'xml2js'
import certService from './cert.js'
import uploadService from './upload.js'

const groupBy = (arr) =>
  arr.reduce(
    (arr, curr) => {
      arr[curr.severity]
        ? arr[curr.severity].push(curr)
        : (arr[curr.severity] = [curr])
      return arr
    },
    { 'very severe': [], severe: [], medium: [] }
  )

const handleEvent = async (event, context) => {
  const parser = new xml2js.Parser()

  const types = {
    modes: ['rail', 'motorways'],
    pti: ['tube', 'croydontramlink'],
    ferries: ['ferry'],
    local: ['london'],
    regions: [
      'scotland',
      'wales',
      'northernireland',
      'northeast',
      'north',
      'northwest',
      'yorkshire-lincolnshire',
      'midlands',
      'eastmidlands',
      'west',
      'oxfordshire',
      'cambridgeshire',
      'east',
      'southwest',
      'south',
      'southeast',
      'channelislands',
    ],
  }

  const oldNews = []
  let cert

  try {
    cert = await certService.getBbcCertP()
  } catch (e) {
    throw new Error(`error while getting cert:` + e)
  }

  for (let type of Object.keys(types)) {
    for (let subType of types[type]) {
      const url = `https://travel-tvp-renderer.api.bbci.co.uk/messages/${type}/${subType}.xml`

      let response
      try {
        response = await fetch(url, {
          dispatcher: new Agent({
            connect: {
              rejectUnauthorized: false,
              ca: cert.ca,
              key: cert.key,
              cert: cert.cert,
            },
          }),
        })
      } catch (e) {
        throw new Error(`error while getting ${url}:` + e)
      }

      const text = await response.text()

      parser.parseString(text, (_, result) => {
        if (result?.tpeg_document?.tpeg_message) {
          for (let message of result.tpeg_document?.tpeg_message) {
            if (
              message.public_transport_information ||
              message.road_traffic_message
            ) {
              const summary = message.summary[0]._

              const info = message.public_transport_information
                ? message.public_transport_information[0]
                : message.road_traffic_message[0]

              const generationDate = new Date(info.$.message_generation_time)
              const dateNow = new Date()
              const severity = info.$.severity_factor

              let daysOld = Math.round(
                (dateNow.getTime() - generationDate.getTime()) /
                  (1000 * 3600 * 24)
              )

              const id = crypto
                .createHash('sha1')
                .update(type + subType + summary + generationDate.toISOString)
                .digest('hex')

              if (daysOld > 1) {
                oldNews.push({
                  type,
                  subType,
                  id,
                  summary,
                  daysOld,
                  severity,
                })
              }
            }
          }
        }
      })
    }
  }

  const sortedNews = oldNews
    .filter((x) => x.severity !== 'slight' && x.severity !== 'very slight')
    .sort((a, b) => b.daysOld - a.daysOld)

  const groupedNews = groupBy(sortedNews, ({ severity }) => severity)

  await uploadService.upload([
    ...groupedNews['very severe'],
    ...groupedNews['severe'],
    ...groupedNews['medium'],
  ])

  return [
    ...groupedNews['very severe'],
    ...groupedNews['severe'],
    ...groupedNews['medium'],
  ]
}

export { handleEvent }
