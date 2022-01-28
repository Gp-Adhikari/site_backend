//////////////////////////////////////////////////////////////////////////////////
// URI=mongodb://localhost:27017/zpro

// ACCESS_TOKEN_SECRET
// REFRESH_TOKEN_SECRET

// EMAIL
// PASSWORD
//////////////////////////////////////////////////////////////////////////////////

//dotenv
require("dotenv").config();
//imported modules
const helmet = require("helmet");
const express = require("express");
const limitter = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const csrf = require("csurf");
const cors = require("cors");

//multer stuff
const multer = require("multer");
multer({ dest: "./public/images", dest: "./public/AppliedApplicant" });

//built in modules
const cluster = require("cluster");
const os = require("os");

//get number of cpus of server
const numCpu = os.cpus().length;

const app = express();

//using helmet for security
app.use(helmet());

//give cors permission
// const allowedDomains = [
//   "http://yourdomain.com",
//   "http://localhost:3000",
//   "http://localhost:8080",
// ]; //our site domain
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // bypass the requests with no origin (like curl requests, mobile apps, etc )
//       if (!origin) return callback(null, true);

//       if (allowedDomains.indexOf(origin) === -1) {
//         const msg = `This site ${origin} does not have an access.`;
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//   })
// );

//limit file size
app.use(express.json({ limit: "50mb" }));

//get json data
app.use(bodyParser.json());

//access cookie easy
app.use(cookieParser());

//csrf protection
// app.use(csrf({ cookie: { httpOnly: true, secure: false } }));

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
require("./models/Admin");
require("./models/Otp");

//routes
const authRoute = require("./routes/authRoute");
const contactRoute = require("./routes/contactRoute");
const portfolioRoute = require("./routes/portfolioRoute");
const vacancyRoute = require("./routes/vacancyRoute");

//use routes
app.use(authRoute);
app.use(contactRoute);
app.use(portfolioRoute);
app.use(vacancyRoute);

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
