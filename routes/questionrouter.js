const router = require('express').Router();

const {DateTime} = require('luxon');
const {body, validationResult} = require('express-validator');
const passport = require('passport');

const Question = require('../models/question');
const jwt = require('jsonwebtoken');
const async = require('async');

router.get('/limit/:start', (req, res) => {
    let startInd = parseInt(req.params.start);
    if(typeof startInd !== 'number') {
        res.sendStatus(404);
    }
    if(startInd <= 0) {
        res.sendStatus(404);
    }
    async.parallel({
        questions: function(cb) {
            Question.find().skip(50*(startInd-1)).limit(20).exec(cb);
        },
        totalquestions: function(cb) {
            Question.countDocuments().exec(cb);
        }
    }, (err, results) => {
        if(err) {return res.sendStatus(400);}
        res.status(200).json({total: results.totalquestions, questions:results.questions});
    })
})

router.get('/:start/search', (req, res) => {
    let startInd = parseInt(req.params.start);
    if(typeof startInd !== 'number') {
        res.sendStatus(404);
    }
    if(startInd <= 0) {
        res.sendStatus(404);
    }
    async.parallel({
        results: function(cb) {
            Question
            .find(
                {$text: 
                    {$search: req.query.query, $caseSensitive:false}
                },
                {hidden:0})
            .limit(10)
            .populate('poster', {username:1})
            .skip(10 * (startInd - 1))
            .exec(cb);
        },
        total: function(cb) {
            Question
            .countDocuments(
                {$text: 
                    {$search: req.query.query, $caseSensitive:false}
                })
            .exec(cb);
        }
    }, (err, results) => {
        if(err) return res.sendStatus(400);
        res.status(200).json({results: results.results, total:results.total})
    })
})

// CRUD
// Create
router.post('/', passport.authenticate('jwt', {session:false}), [
    body('question').exists().isString().isLength({min:3, max:500}),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({errors:['Please enter a question']});
        
        const userToken = req.headers.authorization;
        const token = userToken.split(' ');
        const decoded = jwt.verify(token[1], process.env.SECRET);
        const newQuestion = new Question({
            text: req.body.question,
            poster: decoded.user._id,
            date: DateTime.now()
        });

        newQuestion.save((err) => {
            if(err) {return res.sendStatus(400)}
            res.sendStatus(200);
        })
    }
]);

// read
router.get('/:id', (req, res) => {
    Question.findById(req.params.id).exec((err, result) => {
        if(err) {return res.sendStatus(404)}
        res.send(result);
    })
})

// update
router.put('/:id', passport.authenticate('jwt', {session:false}), [
    body('question').trim().exists().isString().isLength({min:3, max:500}),
    (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {return res.status(200).json({errors:['Please submit a question from 3-500 length.']})}
        Question.findByIdAndUpdate(req.params.id, {text:req.body.question}).exec(err => {
            if(err) {return res.status(400).json({errors:['something went wrong']})}
            res.sendStatus(200);
        })
    }
])

// delete
router.delete('/:id', passport.authenticate('jwt', {session:false}), (req, res) => {
    const userToken = req.headers.authorization;
    const token = userToken.split(' ');
    const decoded = jwt.verify(token[1], process.env.SECRET);
    Question.findOneAndUpdate({_id: req.params.id, poster:decoded.user._id}, {hidden:true})
    .exec(err => {
        if(err) {return res.sendStatus(404)}
        res.sendStatus(200);
    })
})

module.exports = router;