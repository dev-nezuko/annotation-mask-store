import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
