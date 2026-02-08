import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

// Set middleware
app.use(cors());
app.use(express.json());

// Define routes here

export default app;