// pages/api/reservations.js
import { promises as fs } from 'fs';
import path from 'path';

const dbFilePath = path.join(process.cwd(), 'database.json');

// Ensure the database file exists
async function ensureDbExists() {
    try {
        await fs.access(dbFilePath);
    } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile(dbFilePath, JSON.stringify([]));
    }
}

export default async function handler(req, res) {
    await ensureDbExists();

    // GET request to fetch reservations
    if (req.method === 'GET') {
        try {
            const data = await fs.readFile(dbFilePath, 'utf8');
            res.status(200).json(JSON.parse(data));
        } catch (error) {
            console.error('Error reading reservations:', error);
            res.status(500).json({ error: 'Failed to fetch reservations' });
        }
    }

    // POST request to save reservations
    else if (req.method === 'POST') {
        try {
            await fs.writeFile(dbFilePath, JSON.stringify(req.body, null, 2));
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error saving reservations:', error);
            res.status(500).json({ error: 'Failed to save reservations' });
        }
    }

    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}