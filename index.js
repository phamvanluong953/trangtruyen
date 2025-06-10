var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var session = require("express-session");
var MongoStore = require("connect-mongo");
var path = require("path");

var indexRouter = require("./routers/index");
var authRouter = require("./routers/auth");
var theloaiRouter = require("./routers/theloai");
var taikhoanRouter = require("./routers/taikhoan");
var novelRouter = require("./routers/novel");
var chuongRouter = require("./routers/chuong");

var uri =
  "mongodb+srv://admin:admin123@cluster0.6k7cvki.mongodb.net/trangtruyen";
const port = process.env.PORT || 3000;

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

app.use(
  session({
    name: "iNews",
    secret: "Black cat eat black mouse",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: uri,
      ttl: 30 * 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: false,
    },
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  var error = req.session.error;
  var success = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.errorMsg = error || "";
  res.locals.successMsg = success || "";
  next();
});

app.use("/", authRouter);
app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/theloai", theloaiRouter); 
app.use("/taikhoan", taikhoanRouter);
app.use("/novel", novelRouter);
app.use("/chuong", chuongRouter);

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected successfully, starting server...");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
