// Mirrors ShareCodeManager.randomCode: 6 chars, no O/0/I/1/L.
const SHARE_CODE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/

export function isValidShareCode(code) {
  return typeof code === 'string' && SHARE_CODE.test(code)
}
