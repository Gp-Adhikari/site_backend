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

//cors
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "*"],
    // exposedHeaders: ["set-cookie"],
  })
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});

app.use((req, res, next) => {
  res.removeHeader("Cross-Origin-Resource-Policy");
  res.removeHeader("Cross-Origin-Embedder-Policy");
  next();
});

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
app.use(csrf({ cookie: { httpOnly: true, secure: false } }));

//prevent ddos and bruteforce
// app.use(
//   limitter({
//     windowMs: 1 * 1000, //1 sec
//     max: 5, //5 requests max
//     message: {
//       code: 429,
//       status: false,
//       message: "Too many requests, Please try again later.",
//     },
//   })
// );

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
require("./models/RefreshToken");
require("./models/Portfolio");
require("./models/VacancyAnnouncement");
require("./models/VacancyApplicant");
require("./models/Contact");
require("./models/Admin");
require("./models/Otp");
require("./models/PageVisit");
require("./models/TotalVisits");

//routes
const authRoute = require("./routes/authRoute");
const contactRoute = require("./routes/contactRoute");
const portfolioRoute = require("./routes/portfolioRoute");
const vacancyRoute = require("./routes/vacancyRoute");
const pageVisitsRoute = require("./routes/pageVisitRoute");

//get csrf token
app.get("/csrf", (req, res) => {
  return res.status(200).send({ status: true, csrfToken: req.csrfToken() });
});

const PageVisit = mongoose.model("PageVisit");
const TotalVisit = mongoose.model("TotalVisit");

app.get("/", (req, res) => {
  const date =
    new Date().getDate() +
    "-" +
    (new Date().getMonth() + 1) +
    "-" +
    new Date().getFullYear();

  //total visit counter
  TotalVisit.find({}, (err, data) => {
    try {
      const id = String(data[0]._id);
      TotalVisit.findByIdAndUpdate(
        `${id}`,
        {
          visit: parseInt(data[0].visit) + 1,
        },
        (err, data) => {}
      );
    } catch (error) {
      TotalVisit({
        visit: 1,
      }).save();
    }
  });
  PageVisit.find({}, (err, data) => {
    try {
      let dataFound = false;

      //search if today's counter record exists
      data.map((visitsPerDay) => {
        if (
          parseInt(new Date().getDate()) ===
          parseInt(visitsPerDay.createdAt.split("-")[0])
        ) {
          //if today's counter record exists set data found to true
          dataFound = true;
          //update the counter by 1
          PageVisit.findByIdAndUpdate(
            `${visitsPerDay._id}`,
            {
              counter: visitsPerDay.counter + 1,
            },
            (err, data) => {}
          );
        }
      });

      //if the counter field for today doesnt exists
      if (!dataFound) {
        const visits = new PageVisit({
          counter: 1,
          createdAt: date,
        });

        visits.save();
      }
    } catch (error) {}
    return res.status(200).json({ status: true, message: "Welcome!" });
  });
});

//use routes
app.use(authRoute);
app.use(contactRoute);
app.use(portfolioRoute);
app.use(vacancyRoute);
app.use(pageVisitsRoute);

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
