import Alert from "../models/Alert.js";

export const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find();
        res.status(200).json(alerts);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const getTodayAlerts = async (req, res) => {
    const {date} = req.body;
    console.log("date: ", date);
    try {
        const alerts = await Alert.find({date: date});
        res.status(200).json(alerts);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// Octokit.js
// https://github.com/octokit/core.js#readme
//import { Octokit } from "@octokit/core";

export const updateAlerts = async() => {
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      })
      
      await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner: 'socram174',
        repo: 'STWalerts',
        workflow_id: 'main.yml',
        ref: 'master',
      })
}