const socket = io('http://localhost:3000', {
    //socket.connect 한 후에 소켓 연결 가능
    autoConnect: false
});

socket.onAny((event, ...args) => {
    console.log(event, args);
})

const chatBody = document.querySelector('.chat-body');
const userTitle = document.querySelector('#user-title');
const loginContainer = document.querySelector('.login-container');
const userTable = document.querySelector('.users');
const userTagline = document.querySelector('#users-tagline');
const title = document.querySelector('#active-user');
const messages = document.querySelector('.messages');
const msgDiv = document.querySelector('.msg-form');

const loginForm = document.querySelector('.user-login');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username');
    createSession(username.value.toLowerCase());
    username.value = '';
});

const createSession = async (username) => {
    let options = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    };
    console.log('options', options);
    try{
        const response = await fetch('/session', options);
        const data = await response.json();

        console.log('data: ', data);
        console.log('response: ', response);
        if(data.username != undefined){
            socketConnect(data.username, data.userID);
    
            localStorage.setItem('session-username', data.username);
            localStorage.setItem('session-userID', data.userID);
    
            loginContainer.classList.add('d-none');
            chatBody.classList.remove('d-none');
            userTitle.innerHTML = data.username;
        }else{
            console.log('username is undefined');
        }
    }catch(err) {
        console.log(err);
    }
}

const socketConnect = async (username, userID) => {
    socket.auth = { username, userID }
    await socket.connect();
}

const setActiveUser = (element, username, userID) => {
    title.innerHTML = username;
    title.setAttribute('userID', userID);

    const list = document.getElementsByClassName('socket-users');
    for(let i = 0; i < list.length; i++) {
        list[i].classList.remove('table-active');
    }
    element.classList.add('table-active');

    msgDiv.classList.remove('d-none');
    messages.classList.remove('d-none');
    messages.innerHTML = '';
    socket.emit('fetch-messages', { receiver: userID});
    const notify = document.getElementById(userID);
    notify.classList.add('d-none');
}

const appendMessage = ({ message, time, background, position}) => {
    let div = document.createElement('div');
    div.classList.add('message', 'bg-opacity-25', 'rounded', 'm-2', 'px-2', 'py-1', background, position);
    div.innerHTML = `<span class="msg-text">${message}</span><span class="msg-time"k>${time}</span>`;
    messages.append(div);
    messages.scrollTo(0, messages.scrollHeight);
};


socket.on('users-data', ({ users }) => {
    console.log(socket.username);
    console.log(socket.id);
    const index = users.findIndex(user => user.userID === socket.id);
    if (index > -1) {
        users.splice(index, 1);
    }

    userTable.innerHTML = '';
    let ul = `<table class="table table-hover">`;
    for (const user of users) {
        ul += `<tr class="socket-users" onclick="setActiveUser(this, '${user.username}', '${user.userID}')"><td>${user.username}<span class="text-danger ps-1 d-none" id="${user.userID}">!</span></td></tr>`
    }
    ul += `</table>`;

    if(users.length > 0) {
        userTable.innerHTML = ul;
        userTagline.innerHTML = "접속 중인 유저";
        userTagline.classList.add('text-success');
        userTagline.classList.remove('text-danger');
    }else {
        userTagline.innerHTML = "접속 중인 유저 없음";
        userTagline.classList.remove('text-success');
        userTagline.classList.add('text-danger');
    }
})
socket.on('user-away', userID => {
    const to = title.getAttribute('userID');
    if (to === userID) {
        title.innerHTML = '&nbsp;';
        msgDiv.classList.add('d-none');
        messages.classList.add('d-none');
    }
})

const sessionUsername = localStorage.getItem('session-username');
const sessionUserID = localStorage.getItem('session-userID');

if (sessionUsername && sessionUserID ){
    console.log(sessionUsername);
    console.log(sessionUserID);
    socketConnect(sessionUsername, sessionUserID);

    loginContainer.classList.add('d-none');
    chatBody.classList.remove('d-none');
    userTitle.innerHTML = sessionUsername;
}


const msgForm = document.querySelector('.msgForm');
const message = document.getElementById('message');

msgForm.addEventListener('submit', e => {
    e.preventDefault();
    const to = title.getAttribute('userID');
    const time = new Date().toLocaleDateString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const payload = {
        from: socket.id,
        to,
        message: message.value,
        time
    }

    socket.emit('message-to-server', payload);
    appendMessage({ ...payload, background: 'bg-success', position: 'right' });
    message.value = '';
    message.focus();
});


socket.on('message-to-client', ({ from, message, time }) => {
    const receiver = title.getAttribute('userID');
    const notify = document.getElementById(from);
    if(receiver === null) {
        notify.classList.remove('d-none');
    }else if(receiver === from){
        appendMessage({
            message,
            time,
            background: 'bg-secondary',
            position: 'left'
        });
    }else{
        notify.classList.remove('d-none');
    }
})

socket.on('stored-messages', ({ messages }) => {
    if (messages.length > 0) {
        messages.forEach(msg => {
            const payload = {
                message: msg.message,
                time: msg.time
            }
            if (msg.from === socket.id) {
                appendMessage({
                    ...payload,
                    background: 'bg-success',
                    position: 'right'
                })
            } else {
                appendMessage({
                    ...payload,
                    background: 'bg-secondary',
                    position: 'left'
                })
            }
        })
    }
})