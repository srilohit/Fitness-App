require('dotenv').config();
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded( {extended : false } ));
app.use(cookieParser());

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/nav.html');
});

app.get('/registration', (req, res)=>{ 
    res.sendFile(__dirname + '/register.html'); 
});

app.post('/authenticate', (req, res)=>{
    //console.log(req.body);
    var users = JSON.parse( fs.readFileSync('registerData.txt') );
    var filteredUser = users.filter( (user)=>{
        if( user.email === req.body.username && user.password === req.body.password ){
            return true;
        };
    });
    //console.log(filteredUser);
    if( filteredUser.length != 0){
        var token = jwt.sign( { username : req.body.username, password : req.body.password }, 'bunny');
        res.cookie('token', token);
        res.redirect('/workout');
    }
    else{
        res.sendFile(__dirname + '/login.html');
    };
});

app.use( (req, res, next)=>{
    var verifyJWT = jwt.decode(req.cookies.token);
    //console.log(verifyJWT);
    if(verifyJWT){
        next();
    } 
    else{
        res.sendFile(__dirname + '/login.html'); 
    };
});

app.post('/addRegisterData', (req, res)=>{
    //console.log(req.body);
    const registrationData = JSON.parse( fs.readFileSync('registerData.txt') );
    registrationData.push(req.body);
    fs.writeFileSync('registerData.txt', JSON.stringify( registrationData )); 
    res.sendFile(__dirname + '/login.html' );
});

app.get('/login', (req, res)=>{
    res.sendFile(__dirname + '/login.html'); 
});

app.get('/logout', (req, res)=>{
    res.clearCookie('token');
    res.redirect('/login'); 
});

app.get('/workout', (req, res)=>{
    var workouts = JSON.parse( fs.readFileSync('workoutDays.txt') );
    //console.log(workouts);
    var userJwt = jwt.decode(req.cookies.token);
    res.render('workoutTime', { workout : workouts, user : userJwt.username });   
});

app.get('/workout/:id', (req, res)=>{
    //console.log(req.params.id); 
    var workoutTypes = JSON.parse( fs.readFileSync('workoutDays.txt'));
    var exerciseTypes = workoutTypes.find((workouts)=>{
        if(workouts.id === +(req.params.id)){
            return true;
        }
    })
    //console.log(exerciseTypes.workout);
    var userJwt = jwt.decode(req.cookies.token); 
    res.render('exerciseTable', { exercise : exerciseTypes.workout, user : userJwt.username, workoutName : exerciseTypes.exercise, workoutDay : exerciseTypes.day });
});

app.post('/exerciseDoneReport/:day', (req, res)=>{
    var reports = JSON.parse( fs.readFileSync('report.txt'));
    var userJwt = jwt.decode(req.cookies.token); 
    req.body.username = userJwt.username;
    req.body.day = req.params.day;
    reports.push(req.body);
    fs.writeFileSync('report.txt', JSON.stringify(reports));
    res.redirect('/report');
    //console.log(req.body);
});

app.get('/report', (req, res)=>{
    var userJwt = jwt.decode(req.cookies.token);
    //console.log(userJwt);
    var reports = JSON.parse( fs.readFileSync('report.txt')); 
    var filteredReport = reports.filter((report, i)=>{
        if(userJwt.username === report.username){
            return true;
        }
    });
    res.render('userReport', { workoutReport : 'Wait', user : userJwt.username, report : filteredReport });
});

app.listen(process.env.PORT, ()=>{
    console.log(`server is running on ${process.env.PORT}`);   
});
