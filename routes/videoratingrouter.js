const router = require('express').Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const {DateTime} = require('luxon');

const async = require('async');

const {body, validationResult} = require('express-validator');

const VideoRating = require('../models/videorating');
const Video = require('../models/video');

// CRUD
// CREATE and UPDATE
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('videoid').exists().isString().trim(),
    body('rating').exists().isNumeric().isIn([-1, 1]).trim(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors: errors.array()})}

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        
        VideoRating
        .find({video:req.body.videoid, rater:decoded.user._id})
        .exec((err, results) => {
            if(err) {return res.sendStatus(400)}
            if(results.length === 0) {
                const newVideoRating = new VideoRating({
                    video: req.body.videoid,
                    rating: req.body.rating,
                    rater: decoded.user._id,
                    date: DateTime.now()
                })

                newVideoRating.save(err => {
                    if(err) return res.sendStatus(400);
                    res.sendStatus(200);
                })
            }
            else if(results.length > 0) {
                VideoRating.findOneAndUpdate({video: req.body.videoid, rater: decoded.user._id}, {rating:req.body.rating})
                .exec(err => {
                    if(err) return res.sendStatus(400);
                    res.sendStatus(200);
                })
            }
        })
    }
])

// READ
router.get('/:videoid', (req, res) => {
    async.parallel({
        totalpos: function(cb) {
            VideoRating.countDocuments({video:req.params.videoid, rating:1}).exec(cb)
        },
        totalneg: function(cb) {
            VideoRating.countDocuments({video:req.params.videoid, rating:-1}).exec(cb)
        }
    }, 
    (err, results) => {
        if(err) return res.sendStatus(400);
        Video.findByIdAndUpdate(req.params.videoid, {rating: results.totalpos - results.totalneg}).exec(err => {
            if(err) return res.sendStatus(400);
            res.status(200).json({rating: results.totalpos - results.totalneg});
        });
    })
});

// returns a specific users id to a rating
router.get('/user/:videoid/:userid', (req, res) => {
    VideoRating.findOne({video:req.params.videoid, rater:req.params.userid}, {rating:1}).exec((err, result) => {
        if(err) return res.sendStatus(400);
        res.status(200).json({result})
    })
});

// DELETE
router.delete('/:ratingid', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);

    VideoRating.findOneAndDelete({_id: req.params.ratingid, rater: decoded.user._id}).exec(err => {
        if(err) return res.sendStatus(400);
        Video.findByIdAndUpdate(req.body.videoid, {$inc: {rating:-1 * req.body.rating}}).exec(err1 => {
            if(err1) return res.sendStatus(400);
            res.sendStatus(200);
        });
    });
});


module.exports = router;