import assert from 'node:assert'
import { promises } from 'node:fs'
import { mock, test } from 'node:test'
import path from 'path'
import { fileURLToPath } from 'url'
import certService from '../src/cert.js'
import { handleEvent } from '../src/handler.js'

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
    mock.method(global, 'fetch', async (url) => {
      return await promises.readFile(mockMap[url], (data) => data)
    })

    mock.method(certService, 'getBbcCertP', async () => {
      return {
        cert: 'this is a cert',
        key: 'this is a key',
        ca: 'this is a ca cert',
      }
    })

    const result = await handleEvent()

    assert.strictEqual(result[0].subType, 'ferry')
    assert.strictEqual(result[0].id, '9d6a2285af1a5ca888026f94ec626ef792f6a24e')
    assert.strictEqual(result[0].summary, 'Bla bla bla bla')

    console.log(JSON.stringify(result, null, 3))

    assert.strictEqual(result[0].daysOld, 33)
    assert.strictEqual(result[1].daysOld, 30)
    assert.strictEqual(result[2].daysOld, 18)
  })
})
