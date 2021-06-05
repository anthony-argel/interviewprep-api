const router = require('express').Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');

const {body, validationResult} = require('express-validator');

const Comment = require('../models/comment');
const { DateTime } = require('luxon');

// CRUD
// CREATE
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('video').trim().exists().isString(), 
    body('text').trim().exists().isString(),
    body('replyingTo').trim().isString(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({errors:errors.array()})

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);

        const newCommentData = {
            video: req.body.video,
            text: req.body.text,
            date: DateTime.now(),
            poster: decoded.user._id
        }
        if(typeof req.body.replyingTo !== 'undefined' && req.body.replyingTo !== '') {
            newCommentData.replyingTo = req.body.replyingTo;
        }
        
        const newComment = new Comment(newCommentData);
        newComment.save(err => {
            if(err) return res.send(err);
            res.sendStatus(200);
        })
    }
])

// READ
router.get('/:videoid', (req, res) => {
    Comment.find({video:req.params.videoid, hidden:false}, {hidden:0, video:0}).exec((err, results) => {
        if(err) return res.sendStatus(404);
        res.status(200).json({comments:results})
    })
});

// UPDATE
router.put('/:commentid', passport.authenticate('jwt', {session:false}), [
    body('text').trim().exists().isString(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.send(400).json({errors:errors.array()})

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);

        Comment.findOneAndUpdate({_id:req.params.commentid, poster:decoded.user._id}, {text:req.body.text}).exec(err => {
            if(err) return res.sendStatus(400);
            return res.sendStatus(200);
        })
    }
])

// DELETE
router.delete('/:commentid', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);

    Comment.findOneAndUpdate({_id:req.params.commentid, poster:decoded.user._id}, {hidden:true}).exec(err => {
        if(err) return res.sendStatus(400);
        return res.sendStatus(200);
    })
    
})

module.exports = router;