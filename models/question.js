const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    text: {type: String, required:true, minLength:3, maxLength: 500},
    poster: {type: Schema.Types.ObjectId, ref:'User', required:true},
    date: {type:Date, required:true},
    hidden: {type: Boolean, required:true, default:false}
});

module.exports = mongoose.model('Question', QuestionSchema);