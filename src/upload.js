import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const client = new S3Client({ region: 'eu-west-1' })

const generateRows = (sortedNews) =>
  sortedNews
    .map(
      (x) => `<tr>
<td><p>${x.id}<p></td>
<td><p>${x.subType}<p></td>
<td><p>${x.summary}<p></td>
<td><p>${x.daysOld}<p></td>
</tr>`
    )
    .join('')

const buildHtml = (sortedNews) => {
  return (
    `<!DOCTYPE html>
<html>
  <title>Stuck In Traffic</title>
  <head>
    <style>
       body {background-color: #9ABCA7; padding: 40px; font-family: "Fjalla One", sans-serif; font-weight: 400;font-style: normal;}
       h1   {color: #333232;}
       p    {color: #333232;}
       *    {box-sizing: border-box;}
       table {border-spacing: 0px;border-collapse:collapse;width: 100%;max-width: 100%;margin-bottom: 15px;background-color:transparent;text-align: left;}
       th {font-weight: bold;border: 1px solid #333232;padding: 8px;}
       td {border: 1px solid #333232;padding: 8px; }
   </style>
  </head>
  <body>
    <table>
      <tr>
        <td><h1>id</h1></td>
        <td><h1>type</h1></td>
        <td><h1>summary</h1></td>
        <td><h1>days old</h1></td>
      </tr>
      ` +
    generateRows(sortedNews) +
    ` 
    </table>
 </body>
</html>`
  )
}

export const upload = async (sortedNews) => {
  const command = new PutObjectCommand({
    Bucket: 'int-stuck-in-traffic-bucket',
    Key: 'stuck-in-traffic.html',
    Body: buildHtml(sortedNews),
  })

  try {
    const response = await client.send(command)
    console.log(response)
  } catch (e) {
    throw new Error(`error while uploading to s3:` + e)
  }
}

export default { upload }
