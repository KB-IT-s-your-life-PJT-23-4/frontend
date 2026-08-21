const ALLOWED_POST_LOGIN_PATH =
  /^\/(?:my(?:\/|[?#]|$)|simulation(?:[?#]|$)|chat(?:[?#]|$)|admin\/(?:dashboard|users|products|faq|reports?|auth|authorization|audit)(?:[?#]|$))/

export function resolvePostLoginPath(redirect) {
  return typeof redirect === 'string' && ALLOWED_POST_LOGIN_PATH.test(redirect)
    ? redirect
    : '/home'
}
