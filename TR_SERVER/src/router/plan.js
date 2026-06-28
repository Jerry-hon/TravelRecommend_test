import express from 'express';
import planService from '../service/planService.js';

const router = express.Router();

const getToken = (req) => {
  return req.headers.authorization?.replace('Bearer ', '');
};

router.post('/save', (req, res) => {
  const token = getToken(req);
  const { destination, budget, days, planData } = req.body;
  if (!destination || !budget || !days || !planData) {
    return res.status(400).json({ success: false, error: '参数不完整' });
  }
  const result = planService.save(token, destination, budget, days, planData);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.get('/list', (req, res) => {
  const token = getToken(req);
  const result = planService.list(token);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.get('/:id', (req, res) => {
  const token = getToken(req);
  const result = planService.getById(token, Number(req.params.id));
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.delete('/:id', (req, res) => {
  const token = getToken(req);
  const result = planService.delete(token, Number(req.params.id));
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

export default router;
