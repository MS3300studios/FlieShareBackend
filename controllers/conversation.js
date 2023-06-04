const express = require('express');
const router = express();
const cors = require('cors');
const auth = require('../middleware/authorization');
const mongoose = require('mongoose');

const serverCorsOptions = {
    origin: "http://localhost:5173"
}

router.use(cors(serverCorsOptions));
const Conversation = require("../models/Chat").Conversation;
const User = require('../models/User').User;

router.get('/conversations', auth, (req, res) => {
    Conversation.find().exec().then(convs => {

        const userParticipatingConvs = convs.filter(conv => {
            const participantsIds = conv.participants.map(partip => partip._id.toString());

            if(participantsIds.indexOf(req.userData.userId) !== -1) 
                return true
        })

        // const userConvsDtos = userParticipatingConvs.map(singleConv => {
        //     const newParticipants = singleConv.participants.map(partic => ({
        //         _id: partic._id,
        //         nickname: partic.nickname,
        //         photo: partic.photo,
        //         email: partic.email
        //     }))

        //     return ({_id: singleConv._id.toString(), messages: [], participants: [...newParticipants]})
        // })

        res.status(200).json(userParticipatingConvs);
    })
})

router.get('/conversation/:secondId', auth, (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.secondId)){
        console.log('incorrect id format')
        res.status(400).json({error: "provided user id is not a correct mongoose.ObjectId"})
        return;
    }

    Conversation.find().exec().then(async allConversations => {
        let selectedConversation;
        let conversationWasFound = false;
        allConversations.forEach(conversation => {
            const convParticipants = conversation.participants.map(el => el._id.toString())
            if(convParticipants.indexOf(req.userData.userId) !== -1 && convParticipants.indexOf(req.params.secondId) !== -1){
                selectedConversation = conversation;
                conversationWasFound = true;
            }
        })

        if(!conversationWasFound){
            const user1 = await User.findById(req.userData.userId);
            const user2 = await User.findById(req.params.secondId);

            const newConv = new Conversation({ participants: [user1, user2], messages: [] });
            newConv.save().then((savedConv) => {
                res.status(201).json(savedConv);
            }).catch(err => console.log(err))
        } else {
            res.status(200).json(selectedConversation);
        }
    })
})

module.exports = router;