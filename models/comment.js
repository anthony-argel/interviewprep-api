const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    video: {type:Schema.Types.ObjectId, required:true},
    text: {type:String, maxLength:1000, required:true},
    poster: {type: Schema.Types.ObjectId, ref:'User', required:true},
    hidden: {type:Boolean, required:true, default:false},
    replyingTo: {type:Schema.Types.ObjectId, ref:'Comment'},
    date: {type:Date, required:true}
});

module.exports = mongoose.model('Comment', CommentSchema);