const authService = require('../services/auth');
const { ApiError } = require('../errors/apiError');

class AuthController {
  async signup(req, res, next) {
    try {
      const result = await authService.signup({
        email: req.body.email,
        username: req.body.username,
        displayName: req.body.displayName,
        password: req.body.password,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(201).json({ status: 'ok', ...result });
    } catch (err) {
      return next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login({
        email: req.body.email,
        password: req.body.password,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(200).json({ status: 'ok', ...result });
    } catch (err) {
      return next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const header = req.get('authorization') || '';
      const match = header.match(/^Bearer\s+(.+)$/i);
      const accessToken = match ? match[1] : null;

      if (!accessToken) throw new ApiError(400, 'MISSING_TOKEN', 'Authorization Bearer token required to logout.');

      const result = await authService.logout({
        accessToken,
        userId: req.user ? req.user.id : null,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(200).json({ status: 'ok', ...result });
    } catch (err) {
      return next(err);
    }
  }

  async me(req, res) {
    return res.status(200).json({ status: 'ok', user: req.user });
  }
}

module.exports = new AuthController();
