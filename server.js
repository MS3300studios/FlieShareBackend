const express = require("express");
const socket = require("socket.io");
const auth = require("./middleware/authorization");
const cors = require("cors");
const { messageSchema, Conversation } = require("./models/Chat");
require('dotenv').config()

const PORT = 3000;
const app = express();
const socketCorsOptions = {
    cors: true,
    origin: ['*']
    // origin: ['http://localhost:5173']
}
const serverCorsOptions = {
    origin: "http://localhost:5173"
}

app.use(require('./controllers/users'));
app.use(require('./controllers/contacts'));
app.use(require('./controllers/files'));
app.use(require('./controllers/conversation'));
app.use(cors(serverCorsOptions));
app.use(cors());


const server = app.listen(PORT, () => {
    console.log('server is started')
})

const io = socket(server, socketCorsOptions);

app.get('/', (req, res) => {
    res.send('ok')
})

app.get('/auth', auth, (req, res) => {
    res.send('ok')
})

io.on("connection", socket => {
    socket.on('message', message => {  //message: { conversationId: currentConversation._id, text: newMessage, authorNickname: userData.nickname }
        //save message based on schema
        Conversation.findById(message.conversationId).exec().then(conv => {
            const newMessage = { authorNickname: message.authorNickname, text: message.text }
            conv.messages = [...conv.messages, newMessage]
            conv.save().then(resp => {
                io.to(message.conversationId).emit('receiveMessage', {
                    userId: socket.id,
                    message: {...message, createdAt: Date.now() },
                })
            })
        })

    })

    socket.on('join', ({conversationId}) => {
        console.log(`a user joined room nr: ${conversationId}`)
        socket.join(conversationId); //user is joining a specific rom
    })
})