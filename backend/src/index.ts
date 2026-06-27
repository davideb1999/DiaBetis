import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import profileRouter from './routes/profile';
import foodRouter from './routes/food';
import doseRouter from './routes/dose';
import nightscoutRouter from './routes/nightscout';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploadDir = process.env.UPLOAD_DIR ?? path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadDir));

app.use('/api/profile', profileRouter);
app.use('/api/food', foodRouter);
app.use('/api/dose', doseRouter);
app.use('/api/nightscout', nightscoutRouter);

// Serve Angular frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist/frontend/browser');
app.use(express.static(frontendDist));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`DiaBetis corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Error conectando a la base de datos:', err);
  process.exit(1);
});
