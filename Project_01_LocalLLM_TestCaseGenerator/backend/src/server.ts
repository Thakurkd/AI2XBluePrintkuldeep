import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateTestCase } from './llm';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req: Request, res: Response) => {
    try {
        const { provider, model, apiKey, systemPrompt, userPrompt, endpoint } = req.body;
        
        if (!provider || !userPrompt) {
            return res.status(400).json({ error: 'provider and userPrompt are required' });
        }

        const generatedTestCases = await generateTestCase({
            provider,
            model,
            apiKey,
            systemPrompt,
            userPrompt,
            endpoint
        });

        res.json({ result: generatedTestCases });
    } catch (error: any) {
        console.error('Error generating test case:', error);
        res.status(500).json({ error: error.message || 'An error occurred during generation' });
    }
});

app.post('/api/test-connection', async (req: Request, res: Response) => {
    try {
        const { provider, model, apiKey, endpoint } = req.body;
        // A simple ping or quick prompt to test connection
        const testResult = await generateTestCase({
            provider,
            model,
            apiKey,
            systemPrompt: "You are a helpful assistant.",
            userPrompt: "Reply with exactly 'OK'",
            endpoint
        });

        res.json({ success: true, message: 'Connection successful', details: testResult });
    } catch (error: any) {
        console.error('Connection test failed:', error);
        res.status(500).json({ success: false, error: error.message || 'Connection failed' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
