const express = require('express');
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// default option
app.use(fileUpload());

// Static Files
app.use(express.static('public'));
app.use('/upload', express.static(path.join(__dirname, 'upload')));


app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

var db = mysql.createConnection({
  host:process.env.HOST,
  user:process.env.USER,
  password:process.env.PASSWORD,
  database:process.env.DATABASE
});
db.connect(function(err){
  if (err) {
    console.error('error connecting database');
  }
  else {
    console.log('connected database');
  }
})


app.get('/', (req, res) => {
  db.query('SELECT profile_image FROM user', (err, rows) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Database query failed');
      }
      const profileImage = rows[0]?.profile_image || 'default.jpg'; // Fallback to a default image
      res.render('index', { profileImage });
  });
});

app.get('/api/user', (req, res) => {
  db.query('SELECT profile_image FROM user WHERE id = 0', (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
      }
      if (results.length > 0) {
          res.json({ profile_image: results[0].profile_image });
      } else {
          res.json({ profile_image: null });
      }
  });
});

app.post('/', (req, res) => {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // name of the input is sampleFile
  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/upload/' + sampleFile.name;

  console.log(sampleFile);
  console.log('Upload Path:', uploadPath);

  // Use mv() to place file on the server
  sampleFile.mv(uploadPath, function (err) {
    if (err) return res.status(500).send("post gone wrong");

      db.query('UPDATE user SET profile_image = ? WHERE id ="0"', [sampleFile.name], (err, rows) => {
        if (!err) {
          res.redirect('/');
        } else {
          console.log(err);
        }
      });
    });
});

app.listen(port, () => console.log(`Listening on port ${port}`));