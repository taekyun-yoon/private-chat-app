const socket = io('http://localhost:3000/', {
    autoConnect: false
});

socket.onAny((event, ...args) => {
    console.log(event, args);
})

const chatBody = document.querySelector('.chat-body');
const userTitle = document.getElementById('user-title');
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
    await fetch('/session', options)
        .then(res => res.json())
        .then(data => {
            socketConnect(data.username, data.userID);

            localStorage.setItem('session-username', data.username);
            localStorage.setItem('session-userID', data.userID);

            loginContainer.classList.add('d-none');
            chatBody.classList.remove('d-none');
            userTitle.innerHTML = data.username;
        })
        .catch(err =>  console.log(err))
}

const socketConnect = async (username, userID) => {
    socket.auth = { username, userID }
    await socket.connect();
}

socket.on('users-data', ({ users }) => {
    const index = users.findIndex(user => user.userID === socket.id);
    if(index > -1) {
        users.splice(index, 1);
    }

    userTable.innerHTML = '';
    let ul = `<table class="table table-hover">`;
    for (const user of users) {
        ul += `<tr class="socket-users"
        onclick="setActiveUser(this,'${user.username}', '${user.userID}')">
        <td>${user.username}<span class="text-danger ps-1 d-none"
        id="${user.userID}">!</span></td>
        </tr>`;
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