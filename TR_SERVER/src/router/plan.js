import express from 'express';
import planService from '../service/planService.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/save', verifyToken, (req, res) => {
  const email = req.user.email;
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

router.get('/list', verifyToken, (req, res) => {
  const email = req.user.email;
  const result = planService.list(email);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.get('/:id', verifyToken, (req, res) => {
  const email = req.user.email;
  const result = planService.getById(email, Number(req.params.id));
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

router.delete('/:id', verifyToken, (req, res) => {
  const email = req.user.email;
  const result = planService.delete(email, Number(req.params.id));
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

export default router;
