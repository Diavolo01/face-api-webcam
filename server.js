const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'upload')
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname)
  }
})

const upload = multer({ storage })

// default option
app.use(express.json())
// Static Files
app.use(express.static('public'));
app.use('/upload', express.static('upload'));
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');
// app.set('views', path.join(__dirname, 'views'));

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
  res.sendFile(__dirname + '/views/index.html');
  });


app.post('/upload', upload.single('sampleFile'), (req, res) => {
  const { name } = req.body;
  const file = req.file;

  if (!file || !name) {
    return res.status(400).send('Name and image are required.');
  }
  const query = 'INSERT INTO user (name, profile_image) VALUES (?,?)';
  const values = [name,file.filename];
  db.query(query,values, (err, result)=> {
    if (err) {
      return res.status(500).send('server error');
  }
  res.send({ message:file, id: result.insertId ,  url: `http://localhost:5000/upload/${file.filename}`});
})
});


app.listen(port, () => console.log(`Listening on port ${port}`));