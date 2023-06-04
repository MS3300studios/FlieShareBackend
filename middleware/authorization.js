const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try{
        const userToken = req.headers.authorization;
        const decoded = jwt.decode(userToken, process.env.SECRET);
        const expDate = new Date(decoded.exp * 1000);
        if(expDate > new Date()){
            req.userData = decoded;
            next();
        } else {
            console.log("token expired")
            return res.sendStatus(401); //expired
        }
        
    } catch(error){
        console.log('unauthorized middleware caught error')
        console.log(error)
        return res.sendStatus(401);
    }
}