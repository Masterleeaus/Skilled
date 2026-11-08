// Edge fake for the learner auth middleware (src/middleware/authenticate). The bearer token is the learner id.
// No token, or an empty one, is a 401. Organisation is not set here: the tutor wiring looks it up from membership.
export function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ') || header.length <= 'Bearer '.length) {
    next(Object.assign(new Error('Invalid or expired token'), { statusCode: 401 }));
    return;
  }
  req.user = { userId: header.slice('Bearer '.length), role: 'STUDENT' };
  next();
}
