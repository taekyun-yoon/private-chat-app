const express = require('express');
const app = express();
const path = require('path');
const crypto = require('crypto');

const http = require('http');
const { Server } = require('socket.io');
const { default: mongoose } = require('mongoose');
const server = http.createServer(app);
const io = new Server(server);
const dotenv = require('dotenv');
dotenv.config();

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.json());
app.use(express.static(publicDirectoryPath));

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Success to connect DB'))
    .catch(err => console.log(err))

const randomId = () => crypto.randomBytes(8).toString('hex');

app.post('/session', (req, res) => {
    console.log('session connect', req.body.username);
    let data = {
        username: req.body.username,
        userID: randomId()
    }
    res.send(data);
});

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    const userID = socket.handshake.auth.userID;
    if(!username) {
        return next(new Error('Invalid username'));
    }
    socket.username = username;
    socket.id = userID;
    next();
})


let users = [];
io.on('connection', async socket => {
    let userData = {
        username: socket.username,
        userID: socket.userID
    };
    users.push(userData);
    io.emit('users-data', { users });


    socket.on('message-to-server', (message) => {
        // message 이벤트 핸들링 코드 추가
        console.log(`Message from ${socket.username}: ${message}`);
        io.emit('message-from-server', { username: socket.username, message });
    });

    socket.on('fetch-messages', () => {
        // 메시지 가져오기 이벤트 핸들링 코드 추가
        console.log('Fetch messages requested');
        // 여기에 메시지 로직 추가
    });

    socket.on('disconnect', () => {
        // disconnect 이벤트 핸들링 코드 추가
        console.log(`User ${socket.username} disconnected`);
        users = users.filter(user => user.userID !== socket.userID);
        io.emit('users-data', { users });
    });
})

const port = 3000
server.listen(port, () => console.log(`Example app listening on port ${port}!`))