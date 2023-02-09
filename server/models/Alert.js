import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
    date: String,
    powerLevel: Number,
    vbucks: Number,
    zone: String,
    afterReset: Boolean,
});

const Alert = mongoose.model("Alert", AlertSchema);
export default Alert;