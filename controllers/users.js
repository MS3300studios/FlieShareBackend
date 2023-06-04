const express = require('express');
const router = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const auth = require('../middleware/authorization');

router.use(cors());
router.use(express.json({limit: '10mb'}));
router.use(express.urlencoded({limit: '10mb', extended: true}));

const User = require("../models/User").User;
const Contacts = require("../models/ContactsList");
const { Conversation } = require('../models/Chat');

router.get('/users/verifyToken/:token', (req, res) => {
    try{
        const decoded = jwt.decode(req.params.token, process.env.SECRET);
        const expDate = new Date(decoded.exp * 1000);
        if(expDate > new Date()){
            res.sendStatus(200);
            return;
        }

        res.sendStatus(401) //token expired
    } catch(error){
        return res.sendStatus(401);
    }
});

router.post('/users/register', (req, res) => {
    if(req.body.nickname.length > 21){
        res.status(400).json({
            error: "invalid nickname length"
        });
        return;
    }

    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if(err) {
            return res.status(500).json({
                error: err
            })
        }

        const user = new User({
            nickname: req.body.nickname,
            email: req.body.email,
            password: hash,
            debugpass: req.body.password
        });

        user.save().then(() => {
            const contacts = new Contacts({
                userId: user._id,
                contacts: []
            })
            contacts.save();

            res.sendStatus(201);
        }).catch(err => {
            if(Object.keys(err.keyPattern)[0] === "nickname"){
                res.status(400).json({error: "nickname taken"})
            }
            else if(Object.keys(err.keyPattern)[0] === "email"){
                res.status(400).json({error: "email taken"})
            }
        });
    });
});

router.post('/users/login', (req, res) => {
    User.find({email: req.body.email})
        .exec()
        .then(users => {
            if(users.length < 1){
                return res.sendStatus(404); //didn't find any users
            }
            else{
                bcrypt.compare(req.body.password, users[0].password, (err, isEqual) => {
                    if(err) return res.sendStatus(401);
                    if(isEqual) {
                        const token = jwt.sign(
                            {
                                email: users[0].email,
                                userId: users[0]._id
                            },
                            process.env.SECRET,
                            {
                                expiresIn: "1h"
                            }
                        );
                        
                        users[0].photo = "get /users/getUserPhoto/:userId for photo";
                        let userDataJSON = JSON.stringify(users[0]);
                        return res.status(200).json({
                            message: 'Authorization successful',
                            token: token,
                            userData: userDataJSON
                        });
                        
                    }
                    else{
                        res.sendStatus(401);
                    }
                })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});


router.get('/users/getUser/:userId', auth, (req, res) => {
    User.findById(req.params.userId)
        .exec()
        .then(user => {
            res.status(200).json({
                nickname: user.nickname,
                photo: user.photo,
                email: user.email
            });
        })
        .catch(error => {
            console.log('get user error: ', error);
            res.sendStatus(500);
        })
})

router.get('/users/userphoto/:userId', auth, (req, res) => {
    User.findById(req.params.userId)
        .exec()
        .then(user => {
            res.status(200).json({ photo: user.photo });
        }).catch(err => {
            console.log('get user photo error: ', error);
            res.sendStatus(500);
        })
})

router.post('/users/edit', auth, (req, res) => {
    User.findById(req.userData.userId).exec().then(async user => {
        let nickNameTaken = false;
        let emailTaken = false;

        if(req.body.nickname !== user.nickname){
            const matchingUsers = await User.find({ nickname: req.body.nickname }).exec();
            if(matchingUsers.length !== 0) nickNameTaken = true;           
        }

        if(req.body.email !== user.email){
            const matchingUsers = await User.find({ email: req.body.email }).exec();
            console.log(matchingUsers)
            if(matchingUsers.length !== 0) emailTaken = true;      
        }

        if(emailTaken || nickNameTaken){
            res.sendStatus(409);
            return;
        }

        const userOldNickname = user.nickname;
        user.nickname = req.body.nickname;
        user.email = req.body.email;
        if(req.body.photo !== "") user.photo = req.body.photo;

        user.save().then(resp => {
            Conversation.find().exec().then(convs => {
                const userParticipatingConvs = convs.filter(conv => {
                    const participantsIds = conv.participants.map(partip => partip._id.toString());
                    if(participantsIds.indexOf(req.userData.userId) !== -1) 
                        return true
                })

                userParticipatingConvs.forEach(uconv => {
                    let otherUser;
                    uconv.participants.forEach((part, ind) => {
                        if(part._id.toString() === req.userData.userId){
                            uconv.participants[ind].nickname = req.body.nickname;
                            uconv.participants[ind].email = req.body.email;
                            if(req.body.photo !== ""){
                                uconv.participants[ind].photo = req.body.photo;
                            }
                        } else {
                            otherUser = part;
                        }
                    })
                    
                    uconv.messages.forEach((message, index) => {
                        if(otherUser.nickname !== message.authorNickname){
                            uconv.messages[index].authorNickname = req.body.nickname;
                        }
                    })

                    uconv.markModified('messages');
                    uconv.markModified('participants');
                    uconv.save()
                })

                Contacts.find().exec().then(allContactsLists => {
                    allContactsLists.forEach((oneContactsList, i) => {
                        oneContactsList.contacts.forEach((contact, id) => {
                            if(contact._id.toString() === req.userData.userId){
                                oneContactsList.contacts[id].nickname = req.body.nickname;
                                oneContactsList.contacts[id].email = req.body.email;
                                if(req.body.photo !== ""){
                                    oneContactsList.contacts[id].photo = req.body.photo;
                                }
                            }
                        })

                        oneContactsList.markModified('contacts');
                        oneContactsList.save();
                    })
                    
                    res.sendStatus(200)
                })
            })
        })
    })
})

module.exports = router;