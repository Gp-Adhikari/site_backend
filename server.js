//////////////////////////////////////////////////////////////////////////////////
// URI=mongodb://localhost:27017/zpro

// ACCESS_TOKEN_SECRET
// REFRESH_TOKEN_SECRET

// ADMIN_USERNAME
// ADMIN_PASSWORD
//////////////////////////////////////////////////////////////////////////////////

//dotenv
require("dotenv").config();
//imported modules
const express = require("express");
const limitter = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const csrf = require("csurf");

//multer stuff
const multer = require("multer");
multer({ dest: "./public/images", dest: "./public/AppliedApplicant" });

//built in modules
const cluster = require("cluster");
const os = require("os");

//get number of cpus of server
const numCpu = os.cpus().length;

const app = express();

//limit file size
app.use(express.json({ limit: "50mb" }));

//get json data
app.use(bodyParser.json());

//access cookie easy
app.use(cookieParser());

//csrf protection
// app.use(csrf({ cookie: { httpOnly: true, secure: false } }));

//using helmet for security
app.use(helmet());

//prevent ddos and bruteforce
app.use(
  limitter({
    windowMs: 10 * 1000, //10 sec
    max: 5, //5 requests max
    message: {
      code: 429,
      status: false,
      message: "Too many requests, Please try again later.",
    },
  })
);

//connecting to mongodb
mongoose.connect(process.env.URI);

//on connection
mongoose.connection.on("connected", () => {
  //   console.log("connected to database.");
});

//on error
mongoose.connection.on("error", () => {
  console.log("Error connecting to database!");
});

//require models
require("./models/Portfolio");
require("./models/VacancyAnnouncement");
require("./models/VacancyApplicant");
require("./models/Contact");

//routes
const authRoute = require("./routes/authRoute");
const { cookie } = require("express/lib/response");

//use routes
app.use(authRoute);

//if any syntax error occurs ------ do at last
app.use(function (err, req, res, next) {
  if (err.code === "EBADCSRFTOKEN") {
    // handle CSRF token errors here
    res.status(403);
    return res.json({ status: false, message: "Not a valid address." });
  }

  return res
    .status(err.status || 500)
    .json({ status: false, message: "Syntax Error!" });
});

//if the cluster is master
if (cluster.isMaster) {
  for (let i = 0; i < numCpu; i++) {
    cluster.fork();
  }

  //if worker dies or is killed
  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  app.listen(process.env.PORT || 8080, () => {
    console.log("Port: " + 8080, process.pid);
  });
}
