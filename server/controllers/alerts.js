import Alert from "../models/Alert.js";
import Log from "../models/Log.js";

export const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find();
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Unable to load alerts.' });
    }
}

export const getTodayAlerts = async (req, res) => {
    try {
        const date = await Log.find();
        if (!date.length) return res.status(200).json([]);
        const alerts = await Alert.find({date: date[0].lastUpdated});
        res.status(200).json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Unable to load alerts.' });
    }
}
