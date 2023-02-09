import express from 'express';
import { getAlerts, getTodayAlerts } from '../controllers/alerts.js';

const router = express.Router();

router.get('/', getAlerts);
router.post('/update', getTodayAlerts);

export default router;