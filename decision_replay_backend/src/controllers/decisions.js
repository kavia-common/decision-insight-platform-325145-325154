const decisionsService = require('../services/decisions');

class DecisionsController {
  async list(req, res, next) {
    try {
      const rows = await decisionsService.listDecisions({
        userId: req.user.id,
        q: req.query.q,
        status: req.query.status,
        limit: req.query.limit,
        offset: req.query.offset,
      });
      return res.status(200).json({ status: 'ok', decisions: rows });
    } catch (err) {
      return next(err);
    }
  }

  async get(req, res, next) {
    try {
      const row = await decisionsService.getDecision({
        userId: req.user.id,
        decisionId: req.params.decisionId,
      });
      return res.status(200).json({ status: 'ok', decision: row });
    } catch (err) {
      return next(err);
    }
  }

  async create(req, res, next) {
    try {
      const row = await decisionsService.createDecision({
        userId: req.user.id,
        payload: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(201).json({ status: 'ok', decision: row });
    } catch (err) {
      return next(err);
    }
  }

  async update(req, res, next) {
    try {
      const row = await decisionsService.updateDecision({
        userId: req.user.id,
        decisionId: req.params.decisionId,
        payload: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(200).json({ status: 'ok', decision: row });
    } catch (err) {
      return next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await decisionsService.deleteDecision({
        userId: req.user.id,
        decisionId: req.params.decisionId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(200).json({ status: 'ok', ...result });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new DecisionsController();
