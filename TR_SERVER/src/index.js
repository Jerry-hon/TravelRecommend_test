import express from 'express';
import travelRouter from './router/travel.js';
import userRouter from './router/user.js';
import 'dotenv/config';
import cors from 'cors';


const app = express();
const port = process.env.PORT;

// 解析 JSON 请求体
app.use(express.json(), cors({ origin: '*' }));


//创建心跳接口
app.get('/api/heartbeat', (req, res) => {
  console.log(req.query);
  console.log(req.body);
  res.json({ heartbeat: 'pong', timestamp: Date.now() });
});

app.use('/api/travel', travelRouter);
app.use('/api/user', userRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
