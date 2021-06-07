const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
    question: {type:Schema.Types.ObjectId, ref:'Question', required:true},
    youtubeurl: {type:String, maxLength:500, required:true},
    poster: {type: Schema.Types.ObjectId, ref:'User', required:true},
    date: {type:Date, required:true},
    hidden: {type:Boolean, required: true, default:false}, 
    commentcount: {type:Number, required:true, default:0},
    rating: {type:Number, required:true, default:0}
});

module.exports = mongoose.model('Video', VideoSchema);