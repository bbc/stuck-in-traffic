import assert from 'node:assert'
import { promises } from 'node:fs'
import { mock, test } from 'node:test'
import path from 'path'
import { fileURLToPath } from 'url'
import certService from '../src/cert.js'
import { handleEvent } from '../src/handler.js'
import uploadService from '../src/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseUrl = 'https://travel-tvp-renderer.api.bbci.co.uk/messages'
const mockMap = {
  [`${baseUrl}/modes/rail.xml`]: __dirname + `/mock/rail.xml`,
  [`${baseUrl}/pti/tube.xml`]: __dirname + `/mock/tube.xml`,
  [`${baseUrl}/pti/croydontramlink.xml`]:
    __dirname + `/mock/croydontramlink.xml`,
  [`${baseUrl}/ferries/ferry.xml`]: __dirname + `/mock/ferry.xml`,
  [`${baseUrl}/modes/motorways.xml`]: __dirname + `/mock/motorways.xml`,
  [`${baseUrl}/regions/scotland.xml`]: __dirname + `/mock/scotland.xml`,
  [`${baseUrl}/regions/wales.xml`]: __dirname + `/mock/wales.xml`,
  [`${baseUrl}/regions/northernireland.xml`]:
    __dirname + `/mock/northernireland.xml`,
  [`${baseUrl}/local/london.xml`]: __dirname + `/mock/london.xml`,
  [`${baseUrl}/regions/northeast.xml`]: __dirname + `/mock/northeast.xml`,
  [`${baseUrl}/regions/north.xml`]: __dirname + `/mock/north.xml`,
  [`${baseUrl}/regions/northwest.xml`]: __dirname + `/mock/northwest.xml`,
  [`${baseUrl}/regions/yorkshire-lincolnshire.xml`]:
    __dirname + `/mock/yorkshire-lincolnshire.xml`,
  [`${baseUrl}/regions/midlands.xml`]: __dirname + `/mock/midlands.xml`,
  [`${baseUrl}/regions/eastmidlands.xml`]: __dirname + `/mock/eastmidlands.xml`,
  [`${baseUrl}/regions/west.xml`]: __dirname + `/mock/west.xml`,
  [`${baseUrl}/regions/oxfordshire.xml`]: __dirname + `/mock/oxfordshire.xml`,
  [`${baseUrl}/regions/cambridgeshire.xml`]:
    __dirname + `/mock/cambridgeshire.xml`,
  [`${baseUrl}/regions/east.xml`]: __dirname + `/mock/east.xml`,
  [`${baseUrl}/regions/southwest.xml`]: __dirname + `/mock/southwest.xml`,
  [`${baseUrl}/regions/south.xml`]: __dirname + `/mock/south.xml`,
  [`${baseUrl}/regions/southeast.xml`]: __dirname + `/mock/southeast.xml`,
  [`${baseUrl}/regions/channelislands.xml`]:
    __dirname + `/mock/channelislands.xml`,
}

test('it should', async (t) => {
  await t.test('work', async (t) => {
    mock.method(global, 'fetch', async (url) => ({
      status: 200,
      text: () => promises.readFile(mockMap[url], (data) => data),
    }))

    mock.method(certService, 'getBbcCertP', async () => {
      return {
        cert: 'this is a cert',
        key: 'this is a key',
        ca: 'this is a ca cert',
      }
    })

    mock.method(uploadService, 'upload', async () => {
      return 1
    })

    const result = await handleEvent()
    console.log(result)

    assert.strictEqual(result[0]?.subType, 'wales')
    assert.strictEqual(
      result[0]?.id,
      'd65a8ae7989dd4ba4a9b75fea6fc265c0bad133d'
    )
    assert.strictEqual(
      result[0]?.summary,
      `A4119 Rhondda, Cynon, Taff - Temporary lights on A4119 in Coedely at Coedely Roundabout, because of long-term roadworks.`
    )
    assert.strictEqual(result[0]?.daysOld, 456)
    assert.strictEqual(result[1]?.daysOld, 456)
    assert.strictEqual(result[2]?.daysOld, 456)
  })
})
