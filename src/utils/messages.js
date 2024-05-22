const messageModel = require("../models/messages.model");

const saveMessages = async ({ from, to, message, time }) => {
    let token = getToken(from, to);
    let data = {
        from,
        message,
        time
    }
    try{
        const res = await messageModel.updateOne({ 
            userToken: token }, {
            $push: { messages: data}
        });
        console.log('메시지가 생성되었습니다.', res);
    }catch(err) {
        throw err;
    }
    
};

const getToken = (sender, receiver) => {
    let key = [sender, receiver].sort().join("_");
    return key;
}

const fetchMessages = async (io, sender, receiver) => {
    let token = getToken(sender, receiver);
    const foundToken = await messageModel.findOne({ userToken: token });
    if(foundToken) {
        io.to(sender).emit('stored-messages', { messages: foundToken.messages });
    }else {
        let data = {
            userToken : token,
            messages: []
        }
        const message = new messageModel(data);
        const savedMessage = await message.save();
        if(savedMessage) {
            console.log('메시지가 생성되었습니다.');
        }else{
            console.log('메시지 생성 중에 에러가 발생했습니다.');
        }
    }
}

module.exports = { saveMessages, fetchMessages }