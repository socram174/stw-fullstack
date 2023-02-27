import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
    lastUpdated: String,
    afterReset: Boolean,
});

const Log = mongoose.model("Log", LogSchema);
export default Log;