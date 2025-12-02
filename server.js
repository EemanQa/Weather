// server.js - Backend with Prometheus metrics
const express = require('express');
const prometheus = require('prom-client');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Prometheus metrics
const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const weatherApiRequests = new prometheus.Counter({
    name: 'weather_api_requests_total',
    help: 'Total number of weather API requests',
    labelNames: ['city', 'status']
});

const weatherApiResponseTime = new prometheus.Histogram({
    name: 'weather_api_response_time_seconds',
    help: 'Weather API response time in seconds',
    labelNames: ['city'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const appUptime = new prometheus.Gauge({
    name: 'app_uptime_seconds',
    help: 'Application uptime in seconds'
});

let startTime = Date.now();

// Update uptime every 10 seconds
setInterval(() => {
    appUptime.set((Date.now() - startTime) / 1000);
}, 10000);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', prometheus.register.contentType);
        res.end(await prometheus.register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: (Date.now() - startTime) / 1000
    });
});

// Weather API endpoint
app.get('/api/weather/:city', async (req, res) => {
    const city = req.params.city;
    const start = Date.now();
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=4eb3703790b356562054106543b748b2&units=metric`
        );
        
        const responseTime = (Date.now() - start) / 1000;
        weatherApiResponseTime.labels(city).observe(responseTime);
        
        if (response.ok) {
            const data = await response.json();
            weatherApiRequests.labels(city, 'success').inc();
            res.json(data);
        } else {
            weatherApiRequests.labels(city, 'error').inc();
            res.status(response.status).json({ error: 'City not found' });
        }
    } catch (error) {
        weatherApiRequests.labels(city, 'error').inc();
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});