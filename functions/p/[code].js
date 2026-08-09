import { handleShare } from '../_lib/handler.mjs'

export const onRequestGet = ({ params, env, request }) =>
  handleShare({ kind: 'program', params, env, request })
