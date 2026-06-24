import express from 'express';
import travelService from '../service/travelService.js';
import { createStreamResponse } from '../utils/streamUtils.js';

const router = express.Router();
  
router.post('/recommend', async (req, res) => {
  const {destination, budget, days} = req.body;
  if(!destination || !budget || !days) {
    return res.status(400).json({ success: false, error: 'Destination, budget, and days are required' });
  }

  try {
    const response = await travelService.recommend(destination, budget, days);
    const full = response?.content || JSON.stringify(response);

    // 尝试从 AI 返回中提取 JSON
    try {
      const jsonMatch = full.match(/```json\n([\s\S]*?)\n```/) ||
        full.match(/```\n([\s\S]*?)\n```/) ||
        full.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : full;
      const parsed = JSON.parse(jsonStr);
      return res.status(200).json({ success: true, data: parsed });
    } catch (parseError) {
      // JSON 解析失败，直接返回原始内容
      return res.status(200).json({ success: true, raw: full });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/chat', async (req, res) => {
  const {message} = req.body;
  if(!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const stream = createStreamResponse(res);

  const result = await travelService.chat(message, (chunk) => {
    stream.send({type: 'chunk', content: chunk} );
  });
  stream.send({type: 'complete', data: result});
  stream.end();
});

export default router;