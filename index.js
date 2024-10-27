const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

app
  .use(cors())
  .use(bodyParser.json({ limit: "5mb" }))
  .use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
//listen on app
app.listen(process.env.SERVER_PORT, function () {
  console.log("server running on http://localhost:" + process.env.SERVER_PORT);
});

//register router
require("./core")(app);

module.exports = app;
