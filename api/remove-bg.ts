import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrl, apiKey, action, predictionId } = req.body;

    if (!apiKey) {
        return res.status(401).json({ error: 'API Key is required' });
    }

    try {
        if (action === 'start') {
            // Start Prediction
            const response = await fetch("https://api.replicate.com/v1/predictions", {
                method: "POST",
                headers: {
                    "Authorization": `Token ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    version: "a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc", // 851-labs/background-remover
                    input: {
                        image: imageUrl,
                        format: "png",
                        background_type: "rgba"
                    },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return res.status(response.status).json(error);
            }

            const data = await response.json();
            return res.status(201).json(data);

        } else if (action === 'check') {
            // Check Status
            if (!predictionId) {
                return res.status(400).json({ error: 'Prediction ID is required for check action' });
            }

            const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: {
                    "Authorization": `Token ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const error = await response.json();
                return res.status(response.status).json(error);
            }

            const data = await response.json();
            return res.status(200).json(data);
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
