const router = require('express').Router();

const QuestionRating = require('../models/questionrating');
const Question = require('../models/question');
const passport = require('passport');

const {body, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');

const {DateTime} = require('luxon');

const async = require('async');

// CRUD
// CREATE and UPDATE
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('questionid').exists().isString().trim(),
    body('rating').exists().isNumeric().isIn([-1,1]).trim(),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(400).json({errors:['An incorrect rating was received']})}
        
        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        

        QuestionRating
        .find({question:req.body.questionid, rater:decoded.user._id})
        .exec((err, results) => {
            if(err) {return res.sendStatus(400)}
            if(results.length === 0) {
                const newRating = new QuestionRating({
                    question:req.body.questionid,
                    rating: req.body.rating,
                    rater: decoded.user._id,
                    date: DateTime.now()
                });

                newRating.save(err => {
                    if(err) {return res.sendStatus(400)}

                    Question.findByIdAndUpdate(req.body.questionid, {$inc: {rating:req.body.rating}}).exec(err => {
                        if(err) return res.sendStatus(400);
                    });
                    res.sendStatus(200);
                })
            }
            else if (results.length > 0) {
                QuestionRating.findOneAndUpdate({question:req.body.questionid, rater: decoded.user._id}, {rating:req.body.rating}).exec((err, result) => {
                    if(err) return res.sendStatus(400);

                    Question.findByIdAndUpdate(req.body.questionid, {$inc: {rating:req.body.rating}}).exec(err => {
                        if(err) return res.sendStatus(400);
                    });
                    res.sendStatus(200);
                })
            }
        })
    }
]);

// READ
router.get('/:questionid', (req, res) => {
    async.parallel({
        totalpos: function(cb) {
            QuestionRating.countDocuments({question:req.params.questionid, rating:1}).exec(cb)
        },
        totalneg: function(cb) {
            QuestionRating.countDocuments({question:req.params.questionid, rating:-1}).exec(cb)
        }
    }, 
    (err, results) => {
        if(err) return res.sendStatus(400);
        Question.findByIdAndUpdate(req.params.questionid, {rating: results.totalpos - results.totalneg}).exec(err => {
            if(err) return res.sendStatus(400);
            res.status(200).json({rating: results.totalpos - results.totalneg});
        })
    })
});

// DELETE
router.delete('/:ratingid', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);
    console.log(req.body.rating);
    console.log(req.body.questionid);
    QuestionRating.findOneAndDelete({_id: req.params.ratingid, rater: decoded.user._id}).exec(err => {
        if(err) return res.sendStatus(400);
        Question.findByIdAndUpdate(req.body.questionid, {$inc: {rating:-1 * req.body.rating}}).exec(err1 => {
            if(err1) return res.sendStatus(400);
            res.sendStatus(200);
        });
    });
});

module.exports = router;