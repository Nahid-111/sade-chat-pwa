const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const multer = require('multer'); // Şəkil üçün yeni alət
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DB_FILE = './messages.json';

// Şəkillərin hara və hansı adla yazılacağını təyin edirik
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// uploads qovluğunu internetə açırıq ki şəkillər brauzerdə görünsün
app.use('/uploads', express.static('uploads'));

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

// ŞƏKİL YÜKLƏMƏK ÜÇÜN YENİ İNTERNET SƏTRİ (API)
app.post('/upload', upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({ imageUrl: '/uploads/' + req.file.filename });
    } else {
        res.status(400).json({ error: 'Şəkil yüklənmədi' });
    }
});

io.on('connection', (socket) => {
    socket.emit('keçmiş mesajlar', getSavedMessages());

    socket.on('chat mesajı', (data) => {
        const newMsg = {
            username: data.username || 'Anonim',
            text: data.text || '',
            image: data.image || null, // Əgər şəkil varsa bura yazılacaq
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        saveMessage(newMsg);
        io.emit('chat mesajı', newMsg);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server ${PORT} portunda aktivdir.`));
