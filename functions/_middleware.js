const AASA = {
  applinks: {
    details: [
      {
        appIDs: ['28T5K7WQTG.com.vucuong1820.Repto'],
        components: [{ '/': '/p/*' }, { '/': '/w/*' }],
      },
    ],
  },
}

export const onRequest = ({ request, next }) => {
  const { pathname } = new URL(request.url)
  if (pathname === '/.well-known/apple-app-site-association') {
    return new Response(JSON.stringify(AASA), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=3600',
      },
    })
  }
  return next()
}
