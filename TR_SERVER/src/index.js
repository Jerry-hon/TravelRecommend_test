import express from 'express';
import travelRouter from './router/travel.js';
import userRouter from './router/user.js';
import planRouter from './router/plan.js';
import 'dotenv/config';
import cors from 'cors';


const app = express();
const port = process.env.PORT;


app.use(express.json(), cors({ origin: '*' }));

app.get('/api/heartbeat', (req, res) => {
  console.log(req.query);
  console.log(req.body);
  res.json({ heartbeat: 'pong', timestamp: Date.now() });
});

app.use('/api/travel', travelRouter);
app.use('/api/user', userRouter);
app.use('/api/plan', planRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
