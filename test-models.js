const https = require('https');
const fs = require('fs');

async function listModels() {
    const env = fs.readFileSync('.env', 'utf-8');
    const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (!match) {
        console.error("No API key found in .env");
        return;
    }
    const apiKey = match[1].trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.models) {
                    console.log("=== AVAILABLE MODELS FOR YOUR KEY ===");
                    parsed.models
                        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                        .forEach(m => console.log(m.name.replace('models/', '')));
                } else {
                    console.error("API Response missing 'models':", parsed);
                }
            } catch (e) {
                console.error("Failed to parse JSON:", e);
            }
        });
    }).on('error', (err) => {
        console.error("HTTP GET Error:", err.message);
    });
}

listModels();
