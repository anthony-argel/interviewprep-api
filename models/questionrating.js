const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionRatingSchema = new Schema({
    question: {type: Schema.Types.ObjectId, ref:'Question', required:true},
    rating: {type:Number, enum: [-1, 1], required:true},
    rater: {type: Schema.Types.ObjectId, ref:'User', required:true},
    date: {type:Date, required:true}
});

module.exports = mongoose.model('QuestionRating', QuestionRatingSchema);