const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        let ext = path.extname(file.originalname)
        cb(null, `${Date.now()}_${uuidv4()}${ext}`)
    }
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, callback) => {
        callback(null, true)    
    }
})

module.exports = upload;