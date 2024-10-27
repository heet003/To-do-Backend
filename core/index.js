module.exports = function (app, db) {
  require("./middleware")(app);
  require("./routes")(app, db);
};
