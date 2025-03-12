import express from 'express';
import { addSubscriber, notifySubscribers, getSubscribers } from '../controllers/mail.js';

const router = express.Router();

router.post('/subscribers', addSubscriber);
router.get('/notify', notifySubscribers);
router.get('/subscribers', getSubscribers);

export default router;