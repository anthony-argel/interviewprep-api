const router = require('express').Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');

const {body, validationResult} = require('express-validator');

const Comment = require('../models/comment');
const Video = require('../models/video');
const { DateTime } = require('luxon');

// CRUD
// CREATE
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('video').trim().exists().isString(), 
    body('text').trim().exists().isString(),
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
        
        const newComment = new Comment(newCommentData);
        newComment.save(err => {
            if(err) return res.send(err);
            res.sendStatus(200);
        })
    }
])

// READ
router.get('/:videoid', (req, res) => {
    Comment.find({video:req.params.videoid, hidden:false}, {hidden:0, video:0}).populate('poster', {username:1}).exec((err, results) => {
        if(err) return res.sendStatus(404);
        Video.findByIdAndUpdate(req.params.videoid, {commentcount:results.length}).exec(err => {
            if(err) return res.sendStatus(400);
            res.status(200).json({comments:results})
        })
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
        Video.findByIdAndUpdate(req.body.videoid, {$inc :{commentcount: -1}}).exec(err => {
            if(err) return res.sendStatus(400);
            res.sendStatus(200);
        })
    })
    
})

module.exports = router;