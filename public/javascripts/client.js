const sockIp = "ws://192.168.1.151:3000";
const socket = io(sockIp);
socket.on("connect", () => {
    console.log(socket.id);
});

socket.on("message", (data) => {
    showMessage(String(data.message), data.user);
});

socket.on("room-update", (data) => {

});

window.onload = function() {
    //console.log(usrData[0]);
    setAutoUploadAvatar();
    const inputField = document.getElementById('message-box');
    inputField.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
};

function setAutoUploadAvatar(){
    document.getElementById('avatar-input').onchange = function() {
        document.getElementById('avatar-form').submit();        
    }
}

function setUsersInRoom() {

}

function sendMessage() {
    const inputField = document.getElementById('message-box');
    if (inputField.value) {
        socket.emit("message", { message: String(inputField.value)});
        inputField.value = "";
        inputField.focus();
    }
}

function showMessage(message, senderUser) {
    // Creating the message elem
    const chatBox = document.getElementById('chatBox');
    var MsgBox = document.createElement('div');
    MsgBox.classList.add('msg');
    var avatarContainer = document.createElement('div');
    avatarContainer.classList.add('avatar-container');
    var textContainer = document.createElement('div');
    textContainer.classList.add('text-container');
    
    //console.log(linkify.find(message));
    var options = { /* … */ };
    message = linkifyStr(message, options);
    var pMsg = document.createElement('p');

    if (senderUser) {
        var pSender = document.createElement('p');
        var avatarImg = document.createElement('img');
        avatarImg.alt = 'Avatar Img';
        avatarImg.classList.add('avatar');
        avatarImg.src = senderUser.avatarImagePath;
        avatarContainer.appendChild(avatarImg);
        pSender.textContent = senderUser.displayName + ': ';
        textContainer.appendChild(pSender);
    }

    pMsg.innerHTML = message;
    
    textContainer.appendChild(pMsg)
    MsgBox.appendChild(avatarContainer);
    MsgBox.appendChild(textContainer);
    chatBox.appendChild(MsgBox);
    // Updating the scrollbar only if the user is scrolled down
    if (Math.abs(chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight) <= 2 * MsgBox.offsetHeight) {
        chatBox.scrollTop = MsgBox.offsetHeight + MsgBox.offsetTop;
    }
}

socket.on("disconnect", (reason) => {
    console.log(reason);

});