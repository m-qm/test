import express from 'express';
import db from './db/db';
import bodyParser from 'body-parser';
var errorHandler = require('errorhandler');

// Set up the express app
const app = express();
const expressip = require('express-ip');
const requestIp = require('request-ip');
const request = require('request');
const morgan = require('morgan');

const PORT = process.env.PORT || 5000;
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
var http = require("http");
const apiKey = '3d0c0ec318e5bdaab8db9561ea3f38db';


const mongoose = require('mongoose');

app.use(expressip().getIpInfoMiddleware);

app.set("PORT", PORT);

const ipMiddleware = function(req, res, next) {
    const clientIp = requestIp.getClientIp(req); 
    next();
    console.log(clientIp);
};

// Mongoose connect

mongoose.connect('mongodb://localhost/mireia', {
  keepAlive: true,
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Parse incoming requests data

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// EJS

app.use(express.static('public'));

app.set('view engine', 'ejs');

// Render index
app.get('/', function (req, res) {
  res.render('index', {weather: null, error: null});
})

//Post city & get weather

app.post('/', function (req, res) {
  let city = req.body.city;
  let country = req.body.country;

  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city},${country}&units=metric&appid=${apiKey}`
  request(url, function (error, response, body) {
    if(error){
      res.render('index', {weather: null, error: 'Error, please try again'});
    } else {
      let weather_json = JSON.parse(body);
      console.log(weather_json);
      if(weather_json.main == undefined){
        res.render('index', {weather_json: null, error: 'Error, please try again'});
      } else {
        var weather = {
          city : weather_json.name,
          temperature : parseInt(weather_json.main.temp),
          description: weather_json.weather[0].description,
          icon: "http://openweathermap.org/img/w/" + weather_json.weather[0].icon + ".png"
        };

        // var weather = {weather : weather}

        res.render('index', {weather, error: null});
      }
    }
  });
})

// GET Ip info

app.get('/ipinfo', (req, res) => {
  const ipInfo = req.ipInfo;
  var message = `Hey, you are browsing in ${ipInfo.city}, ${ipInfo.country}`;
  // console.log(ipInfo);
  res.render('ipinfo', {ipInfo, error: null});
  res.send(message);
})

// get all users

app.get('/api/v1/users', (req, res) => {
  res.status(200).send({
    success: 'true',
    message: 'users retrieved successfully',
    users: db
  })
});

// post user

app.post('/api/v1/users', (req, res) => {
  if(!req.body.title) {
    return res.status(400).send({
      success: 'false',
      message: 'title is required'
    });
  } else if(!req.body.IP) {
    return res.status(400).send({
      success: 'false',
      message: 'ip is required'
    });
  }
 const users = {
   id: db.length + 1,
   title: req.body.title,
   IP: req.body.IP,
   weather: req.body.weather
 }
 db.push(users);
 return res.status(201).send({
   success: 'true',
   message: 'user added successfully',
   users
 })
});

// get user by id

app.get('/api/v1/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.map((users) => {
    if (users.id === id) {
      return res.status(200).send({
        success: 'true',
        message: 'user retrieved successfully',
        users,
      });
    }
  });
  return res.status(404).send({
    success: 'false',
    message: 'user does not exist',
  });
});

// delete user by id

app.delete('/api/v1/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  db.map((users, index) => {
    if (users.id === id) {
       db.splice(index, 1);
       return res.status(200).send({
         success: 'true',
         message: 'user deleted successfuly',
       });
    }
  });

    return res.status(404).send({
      success: 'false',
      message: 'user not found',
    });
});

// update user

app.put('/api/v1/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let usersFound;
  let itemIndex;
  db.map((users, index) => {
    if (users.id === id) {
      usersFound = users;
      itemIndex = index;
    }
  });

  if (!usersFound) {
    return res.status(404).send({
      success: 'false',
      message: 'user not found',
    });
  }

  if (!req.body.title) {
    return res.status(400).send({
      success: 'false',
      message: 'title is required',
    });
  } else if (!req.body.IP) {
    return res.status(400).send({
      success: 'false',
      message: 'IP is required',
    });
  }

  const updatedUser = {
    id: usersFound.id,
    title: req.body.title || usersFound.title,
    IP: req.body.IP || usersFound.IP,
    weather : req.body.weather || usersFound.weather
  };

  db.splice(itemIndex, 1, updatedUser);

  return res.status(201).send({
    success: 'true',
    message: 'user added successfully',
    updatedUser,
  });
});


app.listen(process.env.PORT || app.get('PORT'), () =>  {
  console.log('App running on http://localhost:' +
        app.get('PORT') + '; press Ctrl-C to terminate.');
});

module.exports = app;
