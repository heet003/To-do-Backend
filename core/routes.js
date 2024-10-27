module.exports = function (app) {
  require("../controller/todos")(app, "/api/todos");
  require("../controller/user")(app, "/api/users");
};
