import { handleShare } from '../_lib/handler.mjs'

export const onRequestGet = ({ params, env, request }) =>
  handleShare({ kind: 'plan', params, env, request })
