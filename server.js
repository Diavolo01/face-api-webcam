const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "upload");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage });

// default option
app.use(express.json());
// Static Files
app.use(express.static("public"));
app.use("/upload", express.static("upload"));
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html');
// app.set('views', path.join(__dirname, 'views'));

var db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});
db.connect(function (err) {
  if (err) {
    console.error("error connecting database");
  } else {
    console.log("connected database");
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/image-url", (req, res) => {
  const upload = path.join(__dirname, "upload"); // Path to the upload folder

  // Read the directory
  fs.readdir(upload, (err, folders) => {
    if (err) {
      console.error("Error reading upload folder:", err);
      return res.status(500).json({ error: "Unable to fetch images" });
    }

    // Filter only directories (user folders)
    const userFolders = folders.filter((folder) => fs.statSync(path.join(upload, folder)).isDirectory());

    // Prepare the image URLs
    const imageUrls = [];

    userFolders.forEach((folder) => {
      const userFolderPath = path.join(upload, folder);
      const files = fs.readdirSync(userFolderPath).filter(file =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );

      files.forEach(file => {
        imageUrls.push(`http://localhost:5000/upload/${folder}/${file}`);
      });
    });

    // Respond with the array of image URLs
    res.json({ imageUrls });
  });
});


app.post("/upload", upload.single("sampleFile"), (req, res) => {
  const { name } = req.body;
  const file = req.file;

  if (!file || !name) {
    return res.status(400).send("Name and image are required.");
  }

  // Create a folder for the user based on the name
  const userFolder = path.join(__dirname, "upload", name);
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });  // Create the folder if it doesn't exist
  }

  // Move the file to the user-specific folder
  const targetPath = path.join(userFolder, file.filename);
  fs.renameSync(file.path, targetPath);  // Move the file

  // Build the image URL
  const imageUrl = `http://localhost:5000/upload/${name}/${file.filename}`;

  const query = "INSERT INTO user (name, profile_image) VALUES (?,?)";
  const values = [name, file.filename];
  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).send("server error");
    }
    res.send({
      message: "Upload successful",
      id: result.insertId,
      file: file,
      url: imageUrl,
    });
  });
  console.log("Upload successful:", imageUrl);
});

app.post("/multipleupload", upload.array("manyFiles", 5), async (req, res) => {
  const { name } = req.body;
  const files = req.files;

  // Validation
  if (!files || files.length === 0 || !name) {
    return res.status(400).send("Name and at least one image are required.");
  }

  // Create a folder for the user based on the name
  const userFolder = path.join(__dirname, "upload", name);
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });  // Create the folder if it doesn't exist
  }

  // Database Query Function
  const insertFile = async (file) => {
    return new Promise((resolve, reject) => {
      // Move the file to the user-specific folder
      const targetPath = path.join(userFolder, file.filename);
      fs.renameSync(file.path, targetPath);  // Move the file

      const imageUrl = `http://localhost:5000/upload/${name}/${file.filename}`;
      
      // Insert into the database
      const query = "INSERT INTO user (name, profile_image) VALUES (?,?)";
      const values = [name, file.filename];

      db.query(query, values, (err, result) => {
        if (err) return reject(err);

        resolve({
          message: "Upload successful",
          id: result.insertId,
          file: file,
          url: imageUrl,
        });
      });
    });
  };

  try {
    // Process each file
    const results = await Promise.all(files.map((file) => insertFile(file)));

    // Send success response
    res.send(results);
  } catch (err) {
    // Log and handle errors
    console.error("Database error:", err);
    res.status(500).send("Server error");
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
