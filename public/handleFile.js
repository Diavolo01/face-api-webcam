// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     db(null,'public/upload/');
//  },
//  filename: (req, file, cb) => {
//   db(null, file.fieldname + '_' + Date.now() + '.' + path.extname(file.originalname))
//   }})
//   const upload = multer({
//     storage: storage
//   })
// Connection Pool
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