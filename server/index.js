import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { alertRepository } from './repositories/alerts.js';
import { createApp } from './app.js';
import { readMcpConfig } from './auth/config.js';
import { createMcpAuth, mongoAuthDatabase } from './auth/better-auth.js';

/* CONFIGURATIONS*/
dotenv.config();
const mcpConfig = readMcpConfig();

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    const auth = mcpConfig ? createMcpAuth(mcpConfig, mongoAuthDatabase(mongoose.connection)) : null;
    const app = createApp({ repository: alertRepository, auth, mcpConfig });
    app.listen(PORT,() => console.log(`Server Port: ${PORT}`));
})
.catch((error) => console.log(`${error} did not connect`))
