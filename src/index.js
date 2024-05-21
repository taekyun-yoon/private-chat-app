const express = require('express');
const app = express();
const path = require('path');

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

let users = [];
io.on('connection', async socket => {
    let userData = {};
    users.push(userData);
    io.emit('users-data', { users });

    socket.on('message-to-server', );
    socket.on('fetch-messages', );
    socket.on('disconnect', );  
})

const port = 3000
server.listen(port, () => console.log(`Example app listening on port ${port}!`))