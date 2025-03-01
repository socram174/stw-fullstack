import express from 'express';
import { addSubscriber, notifySubscribers, getSubscribers } from '../controllers/mail.js';

const router = express.Router();

router.get('/', addSubscriber);
router.get('/notify', notifySubscribers);
router.get('/subscribers', getSubscribers);

export default router;