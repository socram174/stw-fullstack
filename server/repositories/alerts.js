import Alert from '../models/Alert.js';
import Log from '../models/Log.js';

export const alertRepository = {
    // Legacy date formats cannot be sorted/filtered as strings in MongoDB.
    // Keep this adaptation here until the external collector and stored dates migrate.
    findAlerts: () => Alert.find().select('date powerLevel vbucks zone afterReset').lean().exec(),
    findLogs: () => Log.find().select('lastUpdated afterReset').lean().exec(),
};
