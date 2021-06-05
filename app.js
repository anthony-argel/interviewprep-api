var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// middleware
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cors = require('cors');

require('dotenv').config();
require('./passport');

// routers
const userRouter = require('./routes/userrouter');
const questionRouter = require('./routes/questionrouter');
const questionRatingRouter = require('./routes/questionratingrouter');
const videoRouter = require('./routes/videorouter');
const videoRatingRouter = require('./routes/videoratingrouter');
const commentRouter = require('./routes/commentrouter');
const commentRatingRouter = require('./routes/commentratingrouter');

var app = express();

// database
mongoose.connect(process.env.DB_URL, {useNewUrlParser:true, useUnifiedTopology:true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, ('connection error: ')));

mongoose.set('useFindAndModify', false);
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/user', userRouter);
app.use('/question', questionRouter);
app.use('/questionrating', questionRatingRouter);
app.use('/video', videoRouter);
app.use('/videorating', videoRatingRouter);
app.use('/comment', commentRouter);
app.use('/commentrating', commentRatingRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});

module.exports = app;
