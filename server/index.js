const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../client/dist')));

// In-memory storage for sessions and files
const sessions = new Map(); // sessionId -> { files: Array, lastActivity: number }
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Generate random session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Clean up expired sessions (older than 1 hour)
function cleanupExpiredSessions() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [sessionId, session] of sessions.entries()) {
        if (session.lastActivity < oneHourAgo) {
            sessions.delete(sessionId);
            console.log(`Cleaned up expired session: ${sessionId}`);
        }
    }
}

// Run cleanup every 30 minutes
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

// API Routes
app.get('/api/session', (req, res) => {
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
        files: [],
        lastActivity: Date.now()
    });
    res.json({ sessionId });
});

// New: Create session with custom 4-repeated-digit code
app.post('/api/session', (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId || !/^([0-9])\1{3}$/.test(sessionId)) {
        return res.status(400).json({ error: 'Session code must be 4 repeated digits (e.g., 4444)' });
    }
    if (sessions.has(sessionId)) {
        return res.status(409).json({ error: 'Session code already in use' });
    }
    sessions.set(sessionId, {
        files: [],
        lastActivity: Date.now()
    });
    res.json({ sessionId });
});

app.get('/api/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (session) {
        session.lastActivity = Date.now();
        res.json({
            sessionId,
            fileCount: session.files.length,
            files: session.files.map(file => ({
                id: file.id,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedBy: file.uploadedBy,
                uploadedAt: file.uploadedAt
            }))
        });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

app.post('/api/session/:sessionId/upload', (req, res) => {
    const { sessionId } = req.params;
    const { fileName, fileType, fileSize, fileData, clientId } = req.body;
    
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            files: [],
            lastActivity: Date.now()
        });
    }
    
    const session = sessions.get(sessionId);
    
    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    
    // Create file object
    const fileObj = {
        id: Math.random().toString(36).substring(2, 15),
        name: fileName,
        type: fileType,
        size: fileSize,
        data: fileData,
        uploadedBy: clientId,
        uploadedAt: Date.now()
    };
    
    // Add to session files
    session.files.push(fileObj);
    session.lastActivity = Date.now();
    
    console.log(`File uploaded to session ${sessionId}: ${fileObj.name}`);
    
    res.json({ 
        success: true, 
        file: {
            id: fileObj.id,
            name: fileObj.name,
            type: fileObj.type,
            size: fileObj.size,
            uploadedBy: fileObj.uploadedBy,
            uploadedAt: fileObj.uploadedAt
        }
    });
});

app.get('/api/session/:sessionId/file/:fileId', (req, res) => {
    const { sessionId, fileId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const file = session.files.find(f => f.id === fileId);
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }
    // If file.data is a data URL (e.g., data:image/jpeg;base64,...), extract base64 part
    const match = /^data:([^;]+);base64,(.*)$/.exec(file.data);
    if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        res.set('Content-Type', mimeType);
        res.set('Content-Disposition', `attachment; filename="${file.name}"`);
        res.send(Buffer.from(base64Data, 'base64'));
    } else {
        // Fallback: send as octet-stream
        res.set('Content-Type', file.type || 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${file.name}"`);
        res.send(file.data);
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`InstantShare server running on port ${PORT}`);
    console.log(`HTTP API ready for file sharing`);
}); 