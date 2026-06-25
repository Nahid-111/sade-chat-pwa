const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);

// Render təhlükəsizlik kilidini qıran əsas hissə
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const DB_FILE = './messages.json';
const multerInMemory = multer({ storage: multer.memoryStorage() });

function getSavedMessages() {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) { return []; }
}

function saveMessage(msgObject) {
    const messages = getSavedMessages();
    messages.push(msgObject);
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2));
}

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/manifest.json', (req, res) => res.sendFile(__dirname + '/manifest.json'));
app.get('/sw.js', (req, res) => res.sendFile(__dirname + '/sw.js'));

app.post('/upload', multerInMemory.single('image'), (req, res) => {
    if (req.file) {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        res.json({ imageUrl: base64Image });
    } else {
        res.status(400).json({ error: 'Xəta' });
    }
});

io.on('connection', (socket) => {
    socket.emit('keçmiş mesajlar', getSavedMessages());

    socket.on('chat mesajı', (data) => {
        const newMsg = {
            username: data.username || 'Anonim',
            text: data.text || '',
            image: data.image || null,
            audio: data.audio || null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        saveMessage(newMsg);
        io.emit('chat mesajı', newMsg);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
