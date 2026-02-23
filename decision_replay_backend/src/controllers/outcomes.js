const outcomesService = require('../services/outcomes');

class OutcomesController {
  async list(req, res, next) {
    try {
      const rows = await outcomesService.listOutcomes({
        userId: req.user.id,
        decisionId: req.params.decisionId,
      });
      return res.status(200).json({ status: 'ok', outcomes: rows });
    } catch (err) {
      return next(err);
    }
  }

  async create(req, res, next) {
    try {
      const row = await outcomesService.createOutcome({
        userId: req.user.id,
        decisionId: req.params.decisionId,
        payload: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(201).json({ status: 'ok', outcome: row });
    } catch (err) {
      return next(err);
    }
  }

  async update(req, res, next) {
    try {
      const row = await outcomesService.updateOutcome({
        userId: req.user.id,
        outcomeId: req.params.outcomeId,
        payload: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
      });
      return res.status(200).json({ status: 'ok', outcome: row });
    } catch (err) {
      return next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await outcomesService.deleteOutcome({
        userId: req.user.id,
        outcomeId: req.params.outcomeId,
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

module.exports = new OutcomesController();
