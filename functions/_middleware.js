import { wellKnownResponse } from './_lib/wellknown.mjs'

export const onRequest = ({ request, next }) => {
  const { pathname } = new URL(request.url)
  return wellKnownResponse(pathname) ?? next()
}
