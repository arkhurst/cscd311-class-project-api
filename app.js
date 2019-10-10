const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const path = require('path');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended : true
}));
app.set ('views', path.join(__dirname));
app.engine ('hbs', exphbs ({ extname : 'hbs' , defaultLayout : '',
 layoutsDir:__dirname + ''}));
app.set('view engine','hbs');

//------------- get route for homepage and login-----------------
app.get('/home', (req, res) => res.sendFile('home.html', {root : __dirname}));
app.get('/login', (req, res) => res.sendFile('login.html', { root : __dirname}));

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

//------------- get route for error and success page ----------------
app.get('/success', (req, res) => res.sendFile('hallReg.html', { root : __dirname}));
app.get('/error', (req, res) => res.json( {
  message : 'Error logging in',
  cause : 'Incorrect credentials, please check ID and Pin'
}));

//------------- store user credentials in the session --------------
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function(err, user) {
    cb(err, user);
  });
})


mongoose.connect('mongodb://localhost/MyDatabase', (err)=>{
   if(!err){
       console.log("Database connected successfully");
   }else{
       console.log(err);
   }
});

const Schema = mongoose.Schema;
const UserDetail = new Schema({
      username: String,
      password: String
    });
let hallSchema = new mongoose.Schema({
        hall : {type : String},
        block : {type : String},
        room : {type : Number}
    });    
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');
const Hall = mongoose.model('Hall', hallSchema);

/* PASSPORT LOCAL AUTHENTICATION */
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
      UserDetails.findOne({
        username: username 
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }

        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));

//---------------authenticating login route ------------------
app.post('/', 
  passport.authenticate('local', { failureRedirect: '/error' }),
  function(req, res) {
    res.redirect('/success?username='+req.user.username);
  });

app.post('/hallReg', (req, res) => {
    let hall = req.body.hall,
        block = req.body.block,
        room = req.body.room;

    let hallData = {hall : hall , block : block, room : room}

    Hall.create(hallData, (err, hall) => {
        if(!err){
            console.log(hall);
        }else{
            res.json({ 
            message : "Error during data creation" + err });
        }
    });

    res.redirect('/profile');
});  

app.get('/profile', (req, res) => {
    Hall.find((err, docs) => {
        if(!err){
            res.render('profile',{
                list : docs
            });
        } else {
            res.json({'message' : 'Error showing booked hall data' + err});
        }
    });
  });

let port = 7000;
app.listen(port, (err) => {
    if(!err){
     console.log("Server is up on " + port)
    } else {
      console.log(err);
    }
});