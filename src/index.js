const express = require('express');
const app = express();
const path = require('path');
const crypto = require('crypto');
const messageModel = require('../src/models/messages.model');
const { saveMessages, fetchMessages } = require('./utils/messages');

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
    console.log('data: ', data);
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
    console.log(socket.username);
    console.log(socket.id);
    next();
})


let users = [];
io.on('connection', async socket => {
    console.log('connection');

    let userData = {
        username: socket.username,
        userID: socket.id
    };
    console.log(userData);

    users.push(userData);
    io.emit('users-data', { users });


    socket.on('message-to-server', (payload) => {
        io.to(payload.to).emit('message-to-client', payload);
        saveMessages(payload);
    });



    // 데이터베이스에서 메시지 가져오기
    socket.on('fetch-messages', ({ receiver }) => {
        fetchMessages(io, socket.id, receiver);
    })

    socket.on('disconnect', () => {
        users = users.filter(user => user.userID !== socket.id);
        // 사이드바 리스트에서 없애기
        io.emit('users-data', { users })
        // 대화 중이라면 대화창 없애기
        io.emit('user-away', socket.id);
    })
})

const port = 3000
server.listen(port, () => console.log(`Example app listening on port ${port}!`))