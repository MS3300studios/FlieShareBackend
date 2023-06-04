const express = require('express');
const router = express();
const cors = require('cors');
const auth = require('../middleware/authorization');

const serverCorsOptions = {
    origin: "http://localhost:5173"
}

router.use(cors(serverCorsOptions));
const Contacts = require("../models/ContactsList");
const User = require('../models/User').User;

router.get('/contacts', auth, (req, res) => {
    Contacts.findOne({userId: req.userData.userId})
        .exec()
        .then(resp => {
            const safeContacts = resp.contacts.map(contact => ({
                nickname: contact.nickname,
                email: contact.email,
                photo: contact.photo,
                _id: contact._id
            }));

            const safeDto = {
                userId: resp.userId,
                contacts: safeContacts
            }

            return res.status(200).json(safeDto)
        }).catch(err => {
            console.log(err)
            res.status(500).json({ error: err })
        });
});

router.get('/contacts/people', auth, (req, res) => {
    User.find()
        .exec()
        .then(async resp => {
            const usersNoSelf = resp.filter(el => {
                const idstring = el._id.toString()
                return idstring !== req.userData.userId
            })

            const userContacts = await Contacts.findOne({userId: req.userData.userId}).exec();
            const userContactsIds = userContacts.contacts.map(el => el._id.toString());
            const sanitizedUsers = [];
            usersNoSelf.forEach(el => {
                if(userContactsIds.indexOf(el._id.toString()) === -1)
                    sanitizedUsers.push(el)
            })

            const dtoArray = sanitizedUsers.map(user => ({
                _id: user._id,
                email: user.email,
                nickname: user.nickname,
                photo: user.photo
            }));
            
            return res.json(dtoArray)
        }).catch(err => {
            console.log(err)
            res.status(500).json({ error: err })
        });
});

router.get('/contacts/add/:personId', auth, async (req, res) => {
    const userContacts = await Contacts.findOne({userId: req.userData.userId}).exec();
    let isPersonAlreadyInContacts = false;
    userContacts.contacts.forEach(contact => {
        if(contact._id.toString() === req.params.personId) isPersonAlreadyInContacts = true
    });

    if(isPersonAlreadyInContacts){
        return res.status(400).json({ error: "user already in contacts "})
    }

    User.findById(req.params.personId).exec().then(newContact => {
        userContacts.contacts.push(newContact)
        userContacts.save()
            .then(resp => {
                res.status(200).json({ message: "user added" });
            })
            .catch(err => console.log(err));
    })    
});

router.get('/contacts/remove/:personId', auth, async (req, res) => {
    const userContacts = await Contacts.findOne({userId: req.userData.userId}).exec();
    const newContacts = userContacts.contacts.filter(el => el._id.toString() !== req.params.personId)
    console.log(newContacts)

    userContacts.contacts = newContacts;
    userContacts.save().then(resp => {
        res.status(200).json(resp);
    }).catch(err => {
        console.log("error in saving usercontacts after deleting user from that list", err)
        res.status(500).json({error: err})
    });
})

router.get('/contacts/person/:query', auth, (req, res) => {
    if(req.params.query.indexOf("@") !== -1){
        User.find({"email": { $regex: req.params.query}}).exec().then(result => {
            let dtoArray = result.map(el => ({
                email: el.email,
                nickname: el.nickname,
                photo: el.photo,
                _id: el._id.toString()
            }))

            dtoArray = dtoArray.filter(el => el._id.toString() !== req.userData.userId)
            res.status(200).json(dtoArray)
        })
    } else {
        User.find({"nickname": { $regex: req.params.query}}).exec().then(result => {
            let dtoArray = result.map(el => ({
                email: el.email,
                nickname: el.nickname,
                photo: el.photo,
                _id: el._id.toString()
            }))

            dtoArray = dtoArray.filter(el => el._id.toString() !== req.userData.userId)
            res.status(200).json(dtoArray)
        })
    }
})

module.exports = router;