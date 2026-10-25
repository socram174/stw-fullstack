import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
    date: String,
    powerLevel: Number,
    vbucks: Number,
    zone: mongoose.Mixed,
    afterReset: Boolean,
});

AlertSchema.index({ date: -1, vbucks: -1, _id: 1 }, { name: 'alerts_date_reward_id' });

const Alert = mongoose.model("Alert", AlertSchema);
export default Alert;
