import AWS from 'aws-sdk'

const ssm = new AWS.SSM({ region: 'eu-west-1' })

const promisify =
  (fn) =>
  (...args) =>
    new Promise((res, rej) =>
      fn(...args, (err, val) => (err ? rej(err) : res(val)))
    )

const getParameter = promisify(ssm.getParameter.bind(ssm))

const readParamFromSSM = (Name, WithDecryption = false) =>
  getParameter({ Name, WithDecryption }).then((x) => x.Parameter.Value)

const fromBase64 = (data) => Buffer.from(data, 'base64').toString('ascii')

const getBbcCertP = () =>
  Promise.all([
    readParamFromSSM('/credentials/certs/bbc/key', true).then(fromBase64),
    readParamFromSSM('/credentials/certs/bbc/cert', true).then(fromBase64),
    readParamFromSSM('/credentials/certs/bbc/ca', true),
  ]).then(([key, cert, ca]) => ({ key, cert, ca }))

export default { getBbcCertP }
