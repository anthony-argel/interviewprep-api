const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type:String, required:true, minLength:3, maxLength: 50},
    email: {type:String, maxLength: 200},
    password: {type:String, maxLength: 300},
    joindate: {type:Date, required:true}
});

module.exports = mongoose.model('User', UserSchema);