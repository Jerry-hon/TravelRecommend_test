import express from 'express';
import planService from '../service/planService.js';

const router = express.Router();

const getEmail = (req) => {
  return req.headers.authorization?.replace('Bearer ', '');
};

router.post('/save', (req, res) => {
  const email = getEmail(req);
  const { destination, budget, days, planData } = req.body;
  if (!destination || !budget || !days || !planData) {
    return res.status(400).json({ success: false, error: '参数不完整' });
  }
  const result = planService.save(email, destination, budget, days, planData);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.get('/list', (req, res) => {
  const email = getEmail(req);
  const result = planService.list(email);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.get('/:id', (req, res) => {
  const email = getEmail(req);
  const result = planService.getById(email, Number(req.params.id));
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.delete('/:id', (req, res) => {
  const email = getEmail(req);
  const result = planService.delete(email, Number(req.params.id));
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

export default router;
