const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const moment = require('moment');
const app = express();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;


// Setup express
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));



// Get env variables
const port = process.env.PORT || 3000;
const perPage = process.env.PAGE_SIZE || 10;
const mongoUrl = process.env.MONGODB_URI || 'mongodb://mlh-localhost:uSI0Ir6tQg5qtj4Ao485wmlrCFDHmkMTqcrkhLuD9mRHkfj6NIkdB9Q0iZf5xXDzkmeWamyfmf89DW2a1fGC4g==@mlh-localhost.documents.azure.com:10255/mlh-localhost?ssl=true&replicaSet=globaldb';
const defaultPassword = process.env.HACKERLOG_PASSWORD || 'P@ssw0rd!';

// Mongoose Schemas
const ObjectId = mongoose.Schema.ObjectId;
const TimeBlockSchema = mongoose.Schema({
  id: ObjectId,
  start: Date,
  end:   Date,
});
const CategorySchema = mongoose.Schema({
  id: ObjectId,
  name: String,
  color: String,
});
const TaskSchema = mongoose.Schema({
  id: ObjectId,
  descrip: String,
  completed: Boolean,
  timeblocks: [TimeBlockSchema],
  nextScheduled: { type: Date, required: false },
  categoryIds: [ObjectId],
});
const UserSchema = mongoose.Schema({
  id: ObjectId,
  username: String,
  auth: String,     // TBD...
  tasks: [TaskSchema],
  tags: [CategorySchema],
});
const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);
const Category = mongoose.model('Category', CategorySchema);
const TimeBlock = mongoose.model('TimeBlock', TimeBlockSchema);

const updateSchema = mongoose.Schema({
  name: { type: String, required: true },
  update: { type: String, required: true }
}, {
  timestamps: true
});
const Update = mongoose.model('update', updateSchema);

// Routes
app.get('/', (req, res) => {
  const page = Math.max(0, req.query.page);
  const wrongPassword = req.query.wrongPassword;
  Update.find().limit(perPage).skip(perPage * page).sort({ createdAt: 'desc' }).exec().then((updates) => {
    Update.count().exec().then((count) => {
      const pages = count / perPage;
      res.render('index', { title: 'HackerLog', updates, wrongPassword, page, pages, moment });
    }).catch(() => {
      res.redirect('/error');
    });
  }).catch(() => {
    res.redirect('/error');
  });
});

// Posting update
app.post('/update', (req, res) => {
  const { body: { name, update, password } } = req;
  if (!name || !update) {
    res.redirect('/error');
  } else if (true) {
    const userUpdate = new Update({ name, update });
    userUpdate.save().then(() => {
      res.redirect('/');
    }).catch(() => {
      res.redirect('/error');
    });
  } else {
    res.redirect('/?wrongPassword=true');
  }
});

// Some debug messages
console.log("Starting app..");
console.log("Waiting for connection to MongoDB");

mongoose.connect(mongoUrl, { useNewUrlParser: true }).then(() => {
  console.log("Connected to MongoDB!");
  console.log("Starting webserver..");
  app.listen(port, '0.0.0.0', () => console.log(`HackerLog app listening on port ${port}!`));
}).catch(() => {
  console.log("Could not connect to MongoDB server! Shutting down...");
  process.exit(1);
});
