const similarityService = require('../services/similarity');

class SimilarityController {
  async search(req, res, next) {
    try {
      const results = await similarityService.similaritySearch({
        userId: req.user.id,
        queryText: req.body.query,
        limit: req.body.limit,
      });
      return res.status(200).json({ status: 'ok', results, mode: 'text' });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new SimilarityController();
