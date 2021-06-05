const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoRatingSchema = new Schema({
    video: {type: Schema.Types.ObjectId, ref:'Video', required:true},
    rating: {type:Number, enum: [-1, 1], required:true},
    rater: {type: Schema.Types.ObjectId, ref:'User', required:true},
    date: {type:Date, required:true}
});

module.exports = mongoose.model('VideoRating', VideoRatingSchema);