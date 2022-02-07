import { Session } from 'electron'

const gmailOrigin = ['https://mail.google.com']

const allowedHeaders = [
  'authorization',
  'x-goog-authuser',
  'x-user-agent',
  'x-goog-api-key',
  'content-type',
  'x-webchannel-content-type',
  'x-goog-encode-response-if-executable',
  'x-clientdetails'
]

export function initCorsFix(session: Session) {
  session.webRequest.onHeadersReceived((details, callback) => {
    const { responseHeaders } = details
    addHeaderIfUndefined(
      responseHeaders,
      'Access-Control-Allow-Origin',
      gmailOrigin
    )
    addHeaderIfUndefined(
      responseHeaders,
      'Access-Control-Allow-Headers',
      allowedHeaders
    )
    callback({
      responseHeaders
    })

    function addHeaderIfUndefined(
      headerList: Record<string, string[]> | undefined,
      newHeader: string,
      value: string[]
    ) {
      if (
        headerList !== undefined &&
        !(newHeader in headerList) &&
        !(newHeader.toLowerCase() in headerList)
      ) {
        headerList[newHeader] = value
      }
    }
  })
}
