const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentRatingSchema = new Schema({
    comment: {type: Schema.Types.ObjectId, ref:'Comment', required:true},
    rating: {type:Number, enum: [-1, 1], required:true},
    rater: {type: Schema.Types.ObjectId, ref:'User', required:true},
    date: {type:Date, required:true}
});

module.exports = mongoose.model('CommentRating', CommentRatingSchema);