const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.htm': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Add basic CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Save deployed contract address directly to js/config.js
    if (req.method === 'POST' && req.url === '/api/save-contract-address') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const address = data.address ? data.address.trim() : '';

                if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid Ethereum address format' }));
                    return;
                }

                const configPath = path.join(BASE_DIR, 'js', 'config.js');
                let configText = fs.readFileSync(configPath, 'utf8');

                configText = configText.replace(
                    /CONTRACT_ADDRESS:\s*"[^"]*"/,
                    `CONTRACT_ADDRESS: "${address}"`
                );

                fs.writeFileSync(configPath, configText);
                console.log(`[API] Successfully updated CONTRACT_ADDRESS in js/config.js to: ${address}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, address: address }));
            } catch (err) {
                console.error('[API] Error saving contract address:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Static file serving
    let reqUrl = decodeURI(req.url.split('?')[0]);
    if (reqUrl === '/' || reqUrl === '' || reqUrl.toLowerCase() === '/index.html') {
        reqUrl = fs.existsSync(path.join(BASE_DIR, 'index.html')) ? '/index.html' : '/INDEX.HTML';
    }

    let filePath = path.join(BASE_DIR, reqUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = fs.existsSync(path.join(filePath, 'index.html'))
            ? path.join(filePath, 'index.html')
            : path.join(filePath, 'INDEX.HTML');
    }

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`404 Not Found: ${reqUrl}`);
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end(`Server Error: ${err.code}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server successfully started! Access at http://localhost:${PORT}/`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        const altPort = Number(PORT) + 1;
        console.log(`Port ${PORT} in use, attempting port ${altPort}...`);
        server.listen(altPort);
    } else {
        console.error('Server error:', e);
    }
});
