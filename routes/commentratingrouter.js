const router = require('express').Router();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const {DateTime} = require('luxon');

const {body, validationResult} = require('express-validator');

const CommentRating = require('../models/commentrating');
const async = require('async');

// CRUD
// CREATE and UPDATE
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('commentid').exists().isString().trim(),
    body('rating').exists().isNumeric().isIn([-1, 1]).trim(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors: errors.array()})}

        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        
        CommentRating
        .find({comment:req.body.commentid, rater:decoded.user._id})
        .exec((err, results) => {
            if(err) {return res.sendStatus(400)}
            if(results.length === 0) {
                const newCommentRating = new CommentRating({
                    comment: req.body.commentid,
                    rating: req.body.rating,
                    rater: decoded.user._id,
                    date: DateTime.now()
                })

                newCommentRating.save(err => {
                    if(err) return res.sendStatus(400);
                    res.sendStatus(200);
                })
            }
            else if(results.length > 0) {
                CommentRating.findOneAndUpdate({comment: req.body.commentid, rater: decoded.user._id}, {rating:req.body.rating})
                .exec(err => {
                    if(err) return res.sendStatus(400);
                    res.sendStatus(200);
                })
            }
        })
    }
])

// READ
router.get('/:commentid', (req, res) => {
    async.parallel({
        totalpos: function(cb) {
            CommentRating.countDocuments({comment:req.params.commentid, rating:1}).exec(cb)
        },
        totalneg: function(cb) {
            CommentRating.countDocuments({comment:req.params.commentid, rating:-1}).exec(cb)
        }
    }, 
    (err, results) => {
        if(err) return res.sendStatus(400);
        res.status(200).json({rating: results.totalpos - results.totalneg});
    })
})

// DELETE
router.delete('/:ratingid', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);

    CommentRating.findOneAndDelete({_id: req.params.ratingid, rater: decoded.user._id}).exec(err => {
        if(err) return res.sendStatus(400);
        res.sendStatus(200);
    });
});


module.exports = router;