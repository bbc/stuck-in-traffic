import crypto from 'crypto'
import { Agent } from 'undici'
import xml2js from 'xml2js'
import certService from './cert.js'

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
      console.log(type, subType, url)
      let xml
      try {
        xml = await fetch(url, {
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

      parser.parseString(xml, (_, result) => {
        if (result.tpeg_document?.tpeg_message) {
          for (let message of result.tpeg_document?.tpeg_message) {
            if (message.public_transport_information) {
              const summary = message.summary[0]._
              const generationDate = new Date(
                message.public_transport_information[0].$.message_generation_time
              )
              const dateNow = new Date()

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
                  subType,
                  id,
                  summary,
                  daysOld,
                })
              }
            }
          }
        }
      })
    }
  }

  const sortedNews = oldNews.sort((a, b) => b.daysOld - a.daysOld)

  return sortedNews
}

export { handleEvent }
