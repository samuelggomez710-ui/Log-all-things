// Import necessary modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Set path to log.csv
const LOG_FILE = path.join(__dirname, 'log.csv');

// Log every request
app.use((req, res, next) => {
    // Agent tells us mozilla, time is time, method is GET, resource is /, version is HTTP/1.1(__dirname, 'log.csv');
    const rawAgent = req.get('User-Agent') || '';
    const agent = rawAgent.replace(/,/g, ' ');
    const time = new Date().toISOString();
    const method = req.method;
    const resource = req.originalUrl || req.url;
    const version = `HTTP/${req.httpVersion}`;

    // Get status code after response is finished
    res.on('finish', () => {
        const status = res.statusCode;
        // CSV Line
        const line = `${time},${agent},${method},${resource},${version},${status}\n`;
        // Append to file asynchronously
        fs.appendFile(LOG_FILE, line, (err) => {
            if (err) {
                // Log file write error without breaking response
                console.error('Failed to write log:', err);
            }
        });
        // Also log to console
        console.log(line.trim())
    });
    // Proceed to  route handler
    next();
});

// Root route: respond with "ok"
app.get('/', (req, res) => {
    res.status(200).send('ok');
});


// Log route: read CSV and return JSON
app.get('/logs', (req, res) => {
    fs.readFile(LOG_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Could not read lof file" });
        }
        // Split into lines and remove any empty trailing line
        const lines = data.split('\n').filter(line => line.trim() !== '');
        // First line is header
        const header = lines.shift().split(',');

        // Map each csv line to an object using header columns
        const logs = lines.map(line => {
            const parts = line.split(',');
            // Expect exactly 6 parts
            return {
                Agent: parts[0] || '',
                Time: parts[1] || '',
                Method: parts[2] || '',
                Resource: parts[3] || '',
                Version: parts[4] || '',
                Status: parts[5] || ''
            };
        });
        res.json(logs);
    });
});

// Fallback route: repsond ok for any other path
app.use((req, res) => {
    res.status(200).send('ok');
});


module.exports = app;