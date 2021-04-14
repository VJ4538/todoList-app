require('dotenv').config();
const express = require('express')
const ejs =require("ejs");
const bodyParser =require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const date =require('./public/js/date');
const app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.use(session({
    secret:"Testing",
    resave:false,
    saveUninitialized:false
}));

//Use passport
app.use(passport.initialize());
app.use(passport.session());

//Mongoose
//Local testing
// mongoose.connect('mongodb://localhost:27017/todos', {useNewUrlParser: true, useUnifiedTopology: true});

const uri= process.env.DB_link;
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex',true);

//Schema
//USER
const userSchema=new mongoose.Schema({
    name:String,
    username:String,
    email:String,
    password:String,
    googleId:String,
    todos:Array
});

//plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User =new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    }); 
  });

//Google auth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.client_ID,
    clientSecret: process.env.client_secret,
    callbackURL: process.env.absoluteURI + "/auth/google/todo",
    proxy: true 
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    User.findOrCreate({ googleId: profile.id }, {name: profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));

//google authen
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
  );

  app.get('/auth/google/todo', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect secret
    res.redirect('/todo');
});

//Home and login 
app.route('/')
.get((req,res)=>{
    if(req.isAuthenticated()){
        res.redirect('/todo');
    }else{
        res.render('pages/home');
    }
})
.post((req,res)=>{
    //login and vertify
    const user= new User({
        username:req.body.username,
        passowrd:req.body.passowrd
    })

    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/todo');
            })
        }
    })
});

//logout clear authentication
app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/');
})


//Register and authenticate
app.route('/register')
.get((req,res)=>{
    res.render('pages/register');
})
.post((req,res)=>{
    User.register(
        {
        name:req.body.name,
        username:req.body.username,
        email:req.body.email,
        todos:[]
        },req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res,redirect('/register');
        }else{
            // Successful authentication
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/todo');
            })
        }
        let authenticate =User.authenticate();
        authenticate(req.body.username,req.body.password,(err,result)=>{
            if(err){
                res.send(err); // err page
            }else{
                // console.log(result);
            }
        })
    })

});

//User's todo list
app.route('/todo')
.get((req,res)=>{
    if(req.isAuthenticated()){
        // console.log(req.user);
        User.findById(req.user._id,(err,result)=>{
            if(err){
                console.log(err);
            }else{
                // console.log(result.todos);
                res.render('pages/todo',{data:{user:req.user,userTasks:result.todos}});
            }
        })
    }else{
        res.redirect("/");
    }
})
//Adding tasks
.post((req,res)=>{
    let istask=req.body.task;
    let isdelete=req.body.dropid;
    // console.log(istask);
    // console.log(isdelete);
    if(istask!=undefined){
    let task={
        task:req.body.task,
        date:date.day
    }
    // // console.log(req.body.task);
    // console.log(req.user._id);
    User.updateOne({_id:req.user._id},{$push:{todos:task}},(err,result)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect('/todo');
        }
    })
    }else if(isdelete!=undefined){
        // console.log(req.user.id);
        // console.log(req.body.dropid);
        User.updateMany({_id:req.user.id},{$pull:{todos:{task:req.body.dropid}}},(err,result)=>{
            if(err){
                console.log(err);
            }else{
                res.redirect('/todo');
            }
        });
    }

});


//Ports
let port =process.env.PORT;
if(port ==null||port==""){
    port=3000;
}
app.listen(port, function(){
    console.log("server started");
})
