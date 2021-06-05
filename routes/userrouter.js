const router = require('express').Router();

const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {body, validationResult} = require('express-validator');
const {DateTime} = require('luxon');
const User = require('../models/user');

// login
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {session: false}, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                errors:['unable to authenticate']
            });
        }

        req.login(user, {session: false}, (err) => {
            if (err) {
                res.send(err);
            }
            const token = jwt.sign({user}, process.env.SECRET, {expiresIn:"12h"});
                return res.json({token, id: user._id});
            });
    })(req, res);
});

// verify
router.get('/verify', passport.authenticate('jwt', {session:false}), (req, res, next) => {
    res.sendStatus(200);
});

// CRUD
// create
router.post('/', [
    body('username').trim().isString().isLength({min: 3, max:30}).exists(),
    body('email').trim().isEmail().isLength({min: 3, max:50}).exists(),
    body('password').trim().isString().isLength({min:3, max:2000}).exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors:['Something went wrong with your request.']})}
        else {
            User.find({username: req.body.username}).exec((err, result) => {
                if(err){ return res.status(400).json({errors:['Something went wrong.']});}
                if(result.length > 0) {
                    return res.status(400).json({errors:['The username is already taken.']});
                }
                else {
                    User.find({email:req.body.email}).exec((err, result) => {
                        if(err) {return res.json(400).json({errors:['an error occurred while checking email']})}
                        else if(result.length === 0) {
                            bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                                const newUser = new User({
                                    username: req.body.username,
                                    email: req.body.email,
                                    password: hashedPassword,
                                    joindate: DateTime.now()
                                });
            
                                newUser.save((err) => {
                                    if(err) {return res.status(400).json({errors:["an error occurred while creating your account"]})}
                                    else {
                                        return res.sendStatus(200);
                                    }
                                })
                            });
                        }
                        else {
                            return res.status(400).json({errors:['Email is already used. Please use another.']});
                        }
                    })
                }
            })
        }
       
    }
])


// read
router.get('/:id', (req, res) => {
    User.findById({_id:req.params.id}, {username:1, joindate:1}, (err, result) => {
        if(err) return res.status(400).json({errors:["Something went wrong"]});
        res.send(result);
    })
});

// update
router.put('/:id', passport.authenticate('jwt', {session:false}), [
    body('password').trim().exists().isString().isLength({min:3, max:300}),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        if(decoded.user._id !== req.params.id) return res.sendStatus(403);

        bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
            if(err) return res.sendStatus(400).json({errors:['something went wrong']});
            User.findByIdAndUpdate(req.params.id, {password: hashedPassword}, (err) => {
                if(err) return res.status(400).json({message:['something went wrong']});
                res.sendStatus(200);
            })
        })
    }
])

router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);
    if(decoded.user._id !== req.params.id) return res.sendStatus(403);
    User.findByIdAndDelete(req.params.id, (err) => {
        if(err) return res.sendStatus(400);
        res.sendStatus(200);
    })
})

module.exports = router;