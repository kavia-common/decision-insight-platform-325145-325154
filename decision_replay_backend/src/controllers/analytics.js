const analyticsService = require('../services/analytics');
const { ApiError } = require('../errors/apiError');

class AnalyticsController {
  async rollups(req, res, next) {
    try {
      const data = await analyticsService.getRollups({
        userId: req.user.id,
        from: req.query.from,
        to: req.query.to,
      });
      return res.status(200).json({ status: 'ok', rollups: data });
    } catch (err) {
      return next(err);
    }
  }

  async decisionInsights(req, res, next) {
    try {
      const data = await analyticsService.analyzeDecision({
        userId: req.user.id,
        decisionId: req.params.decisionId,
      });
      if (!data) throw new ApiError(404, 'NOT_FOUND', 'Decision not found.');
      return res.status(200).json({ status: 'ok', insights: data });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AnalyticsController();
