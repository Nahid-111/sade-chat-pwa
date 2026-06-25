const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs'); // Faylları oxuyub-yazmaq üçün daxili kitabxana

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DB_FILE = './messages.json';

// Keçmiş mesajları bazadan oxuyan funksiya
function getSavedMessages() {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

// Yeni mesajı bazaya yazan funksiya
function saveMessage(msgObject) {
    const messages = getSavedMessages();
    messages.push(msgObject);
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2));
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('İstifadəçi qoşuldu');

    // Yeni qoşulan şəxsə keçmiş mesajları göndər
    socket.emit('keçmiş mesajlar', getSavedMessages());

    // Mesaj gələndə
    socket.on('chat mesajı', (data) => {
        const newMsg = {
            username: data.username || 'Anonim',
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        saveMessage(newMsg); // Yaddaşa yaz
        io.emit('chat mesajı', newMsg); // Hər kəsə göndər
    });

    socket.on('disconnect', () => {
        console.log('İstifadəçi ayrıldı');
    });
});

server.listen(3000, () => {
    console.log('Server yeniləndi: http://localhost:3000');
});
