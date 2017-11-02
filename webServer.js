"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var Activity = require('./schema/Activity.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();
var fs = require("fs");

// XXX - Your submission should work without this line
// var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if(request.session.login_name === undefined) {
      response.status(401).send('Not Logged In');
      return;
    }

    // response.status(200).send(cs142models.userListModel());
    User.find({}, function(err,userList) {
      if (err) {
          console.error('Doing /user/list error:', err);
          response.status(400).send(JSON.stringify(err));
          return;
      }
      if (userList.length === 0) {
        response.status(400).send('Missing User Object');
        return;
      }

      var returnUserList = [];
      for(var i = 0; i < userList.length; i++) {
        var object = {};
        object.first_name = userList[i].first_name;
        object.last_name = userList[i].last_name;
        object._id = userList[i]._id;
        returnUserList.push(object);
      }
      //console.log(returnUserList);
      response.status(200).send(JSON.stringify(returnUserList));
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if(request.session.login_name === undefined) {
      response.status(401).send('Not Logged In');
      return;
    }
    var id = request.params.id;
    // var user = cs142models.userModel(id);
    User.findOne({_id: id}, function (err, user) {
      if(err) {
        console.error('Doing /user/:id error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      if (user === null) {
          console.log('User with _id:' + id + ' not found.');
          response.status(400).send('Not found');
          return;
      }
      var object = {};
      object.first_name = user.first_name;
      object.last_name = user.last_name;
      object.location = user.location;
      object.description = user.description;
      object.occupation = user.occupation;
      object._id = user._id;

      response.status(200).send(JSON.stringify(object));
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if(request.session.login_name === undefined) {
      response.status(401).send('Not Logged In');
      return;
    }
    var id = request.params.id;
    //var photos = cs142models.photoOfUserModel(id);
    Photo.find({'user_id': id}, function (err, photos) {
      if(err) {
        console.error('Doing /photosOfUser/:id error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
      }
      if (photos.length === 0) {
        console.log('Photos of user with _id:' + id + ' not found.');
        response.status(400).send('Not found');
        return;
      }
      var userPhotos = JSON.parse(JSON.stringify(photos));
      //var returnPhotoList = [];
      async.each(userPhotos, function(photo, callback) {
        var photoObj = {};
        delete photo.__v;
        async.each(photo.comments, function(comment, commentCallback) {
          var commentUser = {};
          User.findOne({_id: comment.user_id}, function (err, user) {
            if(err) {
              console.error('Doing /user/:id error:', err);
              response.status(400).send(JSON.stringify(err));
              return;
            }
            if (user === null) {
                console.log('User with _id:' + id + ' not found.');
                response.status(400).send('Not found');
                return;
            }
            commentUser.first_name = user.first_name;
            commentUser.last_name = user.last_name;
            commentUser._id = user._id;
            comment.user = commentUser;
            delete comment.user_id;
            commentCallback(err);

        });
      }, function(err) {
          if(err) {
            console.log("Error: Comment Async");
          } else {
            callback(err);
          }
      });

    }, function(err) {
      if(err) {
        response.status(400).send(JSON.stringify(err));
        console.log("Error: Comment Async");
      } else {
        //console.log(userPhotos);
        response.status(200).send(userPhotos);
      }
    });
  });
});

app.post('/admin/login', function(request, response){
  var userProfile = request.body.login_name;
  console.log(userProfile);
  var userPassword = request.body.password;
  console.log(userPassword);
  User.findOne({login_name: userProfile, password: userPassword}, function (err, user) {
    if(err) {
      console.error('Doing admin/login error:', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if (user === null) {
        console.log('User ' + userProfile + ' not found.');
        response.status(400).send('User Not found');
        return;
    }
    request.session.login_name = user.login_name;
    request.session.user_id = user._id;
    request.session.first_name = user.first_name;

    var new_activity = {};
    new_activity.user = request.session.first_name;
    new_activity.date_time = new Date();
    new_activity.event_type = 'New Login';
    new_activity.photo = undefined;
    new_activity.comment = undefined;
    Activity.create(new_activity, function(err, activity) {
      if(err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      console.log('created new activity: login', activity);
    });

    response.status(200).send(JSON.parse(JSON.stringify(user)));
  });
});

app.post('/admin/logout', function(request, response){
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }

  var new_activity = {};
  new_activity.user = request.session.first_name;
  new_activity.date_time = new Date();
  new_activity.event_type = 'Logout';
  new_activity.photo = undefined;
  new_activity.comment = undefined;
  Activity.create(new_activity, function(err, activity) {
    if(err) {
      response.status(400).send(JSON.stringify(err));
      return;
    }
    console.log('created new activity: logout', activity);
  });

    delete request.session.login_name;
    delete request.session.user_id;
    delete request.session.first_name;

    request.session.destroy(function (err) {
      if(err) {
        console.error("Not Logged On");
        response.status(400).send(JSON.stringify(err));
        return;
      }
      return;
    });

    response.status(200).send('Logging out');

});

app.post('/commentsOfPhoto/:photo_id', function(request, response){
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }
  if (request.body.newComment === undefined) {
    response.status(400).send('Invalid Comment');
    return;
  }
  var photo_id = request.params.photo_id;
  Photo.findOne({_id:photo_id}, function(err,photo) {
    if(err) {
      console.error('Doing /commentsOfPhoto/:photo_id error:', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if (photo === null) {
      console.log('photo not found.');
      response.status(400).send('Photo Not found');
      return;
    }
    var commentObj = {};
    var curDate = new Date();
    commentObj.comment = request.body.newComment;
    commentObj.date_time = curDate;
    commentObj.user_id = request.session.user_id;
    console.log(commentObj);
    photo.comments.push(commentObj);
    photo.save();

    var new_activity = {};
    new_activity.user = request.session.first_name;
    new_activity.date_time = new Date();
    new_activity.event_type = 'New Comment';
    new_activity.photo = photo.file_name;
    new_activity.comment = request.session.first_name;
    Activity.create(new_activity, function(err, activity) {
      if(err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      console.log('created new activity: New Comment', activity);
    });

    response.status(200).send(photo);
  });
});

// Upload New Photo
app.post('/photos/new', function(request, response){
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }
  processFormBody(request, response, function (err) {
    if (err || !request.file) {
        response.status(400).send(JSON.stringify(err));
        return;
    }

    // request.file has the following properties of interest
    //      fieldname      - Should be 'uploadedphoto' since that is what we sent
    //      originalname:  - The name of the file the user uploaded
    //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
    //      buffer:        - A node Buffer containing the contents of the file
    //      size:          - The size of the file in bytes

    var timestamp = new Date().valueOf();
    var filename = 'U' +  String(timestamp) + request.file.originalname;

    // console.log('test');

    fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
      // XXX - Once you have the file written into your images directory under the name
      // filename you can create the Photo object in the database
      var photoObj = {};
      photoObj.file_name = filename;
      photoObj.date_time = timestamp;
      photoObj.user_id = request.session.user_id;
      photoObj.comments = [];

      console.log(photoObj);

      Photo.create(photoObj, function(err, photo){
        if(err) {
          response.status(400).send(JSON.stringify(err));
          return;
        }

        var new_activity = {};
        new_activity.user = request.session.first_name;
        new_activity.date_time = photo.date_time;
        new_activity.event_type = 'Photo Upload';
        new_activity.photo = photo.file_name;
        new_activity.comment = undefined;
        Activity.create(new_activity, function(err, activity) {
          if(err) {
            response.status(400).send(JSON.stringify(err));
            return;
          }
          console.log('created new activity: Uploaded Photo', activity);
        });

        response.status(200).send();
        return;
      });
    });
  });

});

app.post('/user', function(request, response) {
  var userObj = {};
  userObj.login_name = request.body.login_name;
  userObj.password = request.body.password;
  userObj.first_name = request.body.first_name;
  userObj.last_name = request.body.last_name;
  userObj.location = request.body.location;
  userObj.discription = request.body.description;
  userObj.occupation = request.body.occupation;

  User.findOne({login_name: request.body.login_name}, function(err,user) {
    if(err) {
      console.error('Doing /user registraion', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if(user) {
      console.error('Username Already Taken');
      response.status(400).send('Username Already Taken');
      return;
    }
    User.create(userObj, function(err, newUser){
      if(err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      console.log('created new user', newUser.first_name);

      var new_activity = {};
      new_activity.user = newUser.first_name;
      new_activity.date_time = new Date();
      new_activity.event_type = 'New Registration';
      new_activity.photo = undefined;
      new_activity.comment = undefined;
      Activity.create(new_activity, function(err, activity) {
        if(err) {
          response.status(400).send(JSON.stringify(err));
          return;
        }
        console.log('created new activity: registraion', activity);
      });

      response.status(200).send();
      return;
    });
  });
});

app.post('/addLike/:photoId', function(request, response) {
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }

  var photoId = request.params.photoId;
  Photo.findOne({_id:photoId}, function(err, photo) {
    if(err) {
      console.error('Doing /addLike/:photoId Error', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if (photo === null) {
      console.log('photo not found.');
      response.status(400).send('Photo Not found');
      return;
    }
    photo.likes.push(request.session.user_id);
    console.log('Session User ID: ', request.session.user_id);
    console.log('photoLikes: ', photo.likes);
    photo.save();

    var new_activity = {};
    new_activity.user = request.session.first_name;
    new_activity.date_time = new Date();
    new_activity.event_type = 'Like Photo';
    new_activity.photo = photo.file_name;
    new_activity.comment = undefined;
    Activity.create(new_activity, function(err, activity) {
      if(err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      console.log('created new activity: like', activity);
    });

    response.status(200).send(photo);
  });
});

app.post('/removeLike/:photoId', function(request, response) {
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }
  var photoId = request.params.photoId;
  Photo.findOne({_id:photoId}, function(err, photo) {
    if(err) {
      console.error('Doing /removeLike/:photoId Error', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if (photo === null) {
      console.log('photo not found.');
      response.status(400).send('Photo Not found');
      return;
    }

    var userIndex = photo.likes.indexOf(request.session.user_id);
    if (userIndex > -1) {
      photo.likes.splice(userIndex, 1);
    }
    console.log('photoLikes: ', photo.likes);
    photo.save();

    var new_activity = {};
    new_activity.user = request.session.first_name;
    new_activity.date_time = new Date();
    new_activity.event_type = 'Dislike Photo';
    new_activity.photo = photo.file_name;
    new_activity.comment = undefined;
    Activity.create(new_activity, function(err, activity) {
      if(err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      console.log('created new activity: dislike', activity);
    });
    response.status(200).send(photo);
  });
});

app.get('/activityFeed', function(request, response) {
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }
  Activity.find({},function(err,activity){
    if (err) {
        console.error('Doing activity error:', err);
        response.status(400).send(JSON.stringify(err));
        return;
    }
    if (activity === undefined) {
      response.status(400).send('Missing Activity Object');
      return;
    }
    response.status(200).send(activity);
  });
});

app.post('/deleteComment/:photo_id/:comment_id', function(request, response){
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }
  // if (request.body.comment === undefined) {
  //   response.status(400).send('Invalid Comment');
  //   return;
  // }
  var photo_id = request.params.photo_id;
  var comment_id = request.params.comment_id;
  console.log('COMMMENT ID',comment_id);
  Photo.findOne({_id:photo_id}, function(err,photo) {
    if(err) {
      console.error('Doing /commentsOfPhoto/:photo_id error:', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if (photo === null) {
      console.log('photo not found.');
      response.status(400).send('Photo Not found');
      return;
    }
    for(var i = 0; i < photo.comments.length; i++) {
      var comment = photo.comments[i];
      if (String(comment.user_id) === String(request.session.user_id) && String(comment_id) === String(comment._id)) {
        console.log('Deleted Comment: ', comment);
        comment.remove();
      }
    }
    photo.save()

    var new_activity = {};
    new_activity.user = request.session.first_name;
    new_activity.date_time = new Date();
    new_activity.event_type = 'Deleted Comment';
    new_activity.photo = photo.file_name;
    new_activity.comment = request.session.first_name;
    Activity.create(new_activity, function(err, activity) {
      if(err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      console.log('created new activity: Delete Comment', activity);
    });

    response.status(200).send(photo);
  });
});

app.post('/deletePhoto/:photo_id', function(request, response){
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }
  var photo_id = request.params.photo_id;

  Photo.findOne({_id:photo_id}, function(err,photo) {
    if(err) {
      console.error('Doing /commentsOfPhoto/:photo_id error:', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if (photo === null) {
      console.log('photo not found.');
      response.status(400).send('Photo Not found');
      return;
    }
    if(String(photo.user_id) === String(request.session.user_id)) {
      Photo.remove({_id:photo_id}, function(err){
        if(err) {
          console.error('Doing Remove Photo', err);
          response.status(400).send(JSON.stringify(err));
          return;
        }
        photo.save();

        var new_activity = {};
        new_activity.user = request.session.first_name;
        new_activity.date_time = new Date();
        new_activity.event_type = 'Deleted Photo';
        new_activity.photo = photo.file_name;
        new_activity.comment = undefined;
        Activity.create(new_activity, function(err, activity) {
          if(err) {
            response.status(400).send(JSON.stringify(err));
            return;
          }
          console.log('created new activity: Delete Comment', activity);
        });

        response.status(200).send(photo);
      });
    }
  });
});

app.post('/deleteUser/:id', function(request, response){
  if(request.session === undefined) {
    response.status(400).send('Not found');
    return;
  }
  var user_id = request.params.id;

  //Delete User's photos
  Photo.find({user_id: user_id}, function(err, photos) {
    if(err) {
      console.error('Doing delete user photos error', err);
      response.status(400).send(JSON.stringify(err));
      return;
    }
    for(var i = 0; i < photos.length; i++) {
      delete photos[i];
    }

      Activity.find({}, function(err, activity){
        if (err) {
          console.error('Doing activity error:', err);
          response.status(400).send(JSON.stringify(err));
          return;
        }
        if (activity === undefined) {
          response.status(400).send('Missing Activity Object');
          return;
        }

        for(var k = 0; k < activity.length; k++) {
          if(String(activity[k].user) === String(request.session.first_name)) {
            activity[k].remove();
          }
        }
        console.log("DELETED ACTIVITY");


        //Delete User
        User.findOne({_id:user_id}, function(err,user) {
          if(err) {
            console.error('Doing /user/:id error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
          }
          if (user === null) {
            console.log('User with _id:' + user_id + ' not found.');
            response.status(400).send('Not found');
            return;
          }
          user.remove();
          console.log("DELETED USER FROM DATABASE");

        });
      });
      response.status(200).send();
  });

});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
