const router = require('express').Router();

const {DateTime} = require('luxon');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const Video = require('../models/video');
const Question = require('../models/question');

// CRUD
// CREATE
router.post('/:questionid', passport.authenticate('jwt', {session:false}), [
    body('youtubeurl').trim().exists().isString().isLength({min:3, max:500}),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()})

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);

        const newVideo = new Video({
            question: req.params.questionid,
            youtubeurl: req.body.youtubeurl,
            poster: decoded.user._id,
            date: DateTime.now()
        });

        newVideo.save(err => {
            if(err) return res.sendStatus(400);
            Question.findByIdAndUpdate(req.params.questionid, {$inc: {videocount:1}}).exec(err => {
                if(err) return res.sendStatus(400);
            });
            res.sendStatus(200);
        });
    }
]);

// READ
router.get('/:videoid', (req, res) => {
    Video.findOne({_id: req.params.videoid, hidden:false}, {hidden:0}).populate('poster', {username:1}).populate('question', {text:1}).exec((err, result) => {
        if(err) return res.sendStatus(400);
        res.status(200).json({video: result});
    })
})

// DELETE
router.delete('/:videoid', passport.authenticate('jwt', {session:false}), (req, res) => {

    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);

    Video.findOneAndUpdate({_id: req.params.videoid, poster:decoded.user._id}, {hidden:true}).exec(err => {
        if(err) return res.sendStatus(400);
        Question.findByIdAndUpdate(req.body.questionid, {$inc: {videocount:-1}}).exec(err => {
            if(err) return res.sendStatus(400);
        });
        res.sendStatus(200);
    })
})


module.exports = router;