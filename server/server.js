import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import db from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Security and Performance Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many API requests, please try again later" }
});

app.use('/api/', apiLimiter);

// In-Memory Cache for Audits
const auditCache = new Map();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'samatva_ultra_secret_2026';
const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("FATAL: VITE_GEMINI_API_KEY is not set in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

app.get('/', (req, res) => {
    res.json({ status: "Samatva AI Backend Running", version: "1.0.0" });
});

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Auth Endpoints ---
app.post('/api/auth/register', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').optional().isString()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
        const { email, password, name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
        const result = stmt.run(email, hashedPassword, name || '');
        
        const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: result.lastInsertRowid, email, name } });
    } catch (error) {
        res.status(400).json({ error: "Email already exists or invalid data" });
    }
});

app.post('/api/auth/login', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, email, name: user.name } });
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

// --- Audit Endpoints ---
app.post('/api/audit', [
    body('attribute').isString().notEmpty(),
    body('outcome').isString().notEmpty(),
    body('score').isNumeric(),
    body('lowGroup').isString().notEmpty(),
    body('lowRate').isNumeric(),
    body('highGroup').isString().notEmpty(),
    body('highRate').isNumeric(),
    body('userId').optional().isInt()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid audit parameters provided" });
    }

    try {
        const { attribute, outcome, score, lowGroup, lowRate, highGroup, highRate, userId } = req.body;
        
        // Cache Key Generation
        const cacheKey = `${attribute}_${outcome}_${score}_${lowGroup}_${lowRate}_${highGroup}_${highRate}`;
        
        if (auditCache.has(cacheKey)) {
            console.log('[Backend] Audit Cache hit!');
            const cachedResult = auditCache.get(cacheKey);
            
            if (userId) {
                const stmt = db.prepare(`
                    INSERT INTO audits (user_id, attribute, outcome, score, analysis, report, model_name) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                stmt.run(userId, attribute, outcome, score, cachedResult.analysis, cachedResult.report, cachedResult.model);
            }
            return res.json(cachedResult);
        }

        const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest"];
        let result = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Backend] Attempting model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const ethicistPrompt = `You are an expert AI Ethicist and Compliance Officer. 
                Audit context: Attribute="${attribute}", Outcome="${outcome}". 
                Results: Score=${score}, LowGroup="${lowGroup}" (${lowRate}%), HighGroup="${highGroup}" (${highRate}%).
                Provide a concise, professional 2-3 sentence ethical analysis. No formatting.`;

                const ethicistResult = await model.generateContent(ethicistPrompt);
                const analysisText = ethicistResult.response.text();

                const reportPrompt = `Generate a detailed AI Compliance Report for an audit of "${outcome}" based on "${attribute}". 
                Results: Fairness Score ${score}, LowGroup=${lowGroup} (${lowRate}%).
                Sections: EXECUTIVE SUMMARY, REGULATORY ALIGNMENT (EU AI Act, US EEOC, India AI Act), RECOMMENDED MITIGATIONS.
                No markdown headers, use ALL CAPS for section titles.`;

                const reportResult = await model.generateContent(reportPrompt);
                const reportText = reportResult.response.text();

                result = { analysis: analysisText, report: reportText, model: modelName };
                
                // Save to cache
                auditCache.set(cacheKey, result);
                
                // Keep cache size manageable
                if (auditCache.size > 1000) {
                    const firstKey = auditCache.keys().next().value;
                    auditCache.delete(firstKey);
                }
                
                // Save to DB if userId is provided
                if (userId) {
                    const stmt = db.prepare(`
                        INSERT INTO audits (user_id, attribute, outcome, score, analysis, report, model_name) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
                    stmt.run(userId, attribute, outcome, score, analysisText, reportText, modelName);
                }

                console.log(`[Backend] Success and Saved (User: ${userId || 'Guest'})`);
                break;
            } catch (err) {
                console.warn(`[Backend] Model ${modelName} failed. Status: ${err.status}, Message: ${err.message}`);
                lastError = err;
            }
        }

        if (result) {
            res.json(result);
        } else {
            throw lastError || new Error("All models failed");
        }

    } catch (error) {
        console.error("[Backend] Audit API Error:", error);
        res.status(500).json({ error: error.message || "Failed to process audit" });
    }
});

app.get('/api/audits/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    
    // Authorization check: User can only access their own audits
    if (req.user.id !== userId) {
        return res.status(403).json({ error: "Forbidden: Cannot access other user's audits" });
    }

    try {
        const audits = db.prepare('SELECT * FROM audits WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        res.json(audits);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch audits" });
    }
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error('[Backend] Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`\uD83D\uDE80 Samatva Backend running on http://localhost:${PORT}`);
});
