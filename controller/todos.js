var express = require("express");
var todosRouter = express.Router();
var db = require("../lib/database/mongodb/index");
var helper = require("../core/helper");
let todos = {};

todos.getTodos = async (req, res, next) => {
  var { userId } = req.uSession;
  let user;
  let promise = helper.paramValidate({ code: 401, val: !userId });

  promise 
    .then(() => {
      return db._find("users", { _id: userId });
    })
    .then(async (foundUser) => {
      if (!foundUser) {
        return Promise.reject(2007); 
      }
      user = foundUser[0];
      let userTodoIds = user.todos;
      if (user.role == "admin") {
        return await db._find("todos", {});
      }
      return await db._find("todos", {
        _id: { $in: userTodoIds },
      });
    })
    .then((todos) => helper.success(res, { notes: todos }))
    .catch((e) => {
      helper.error(res, e); 
    });
};

todos.deleteTodo = async (req, res, next) => {
  var { todoId } = req.params;
  var { userId } = req.uSession;
  let foundTodo;
  let promise = helper.paramValidate(
    { code: 2001, val: !todoId }, // "todoId required"
    { code: 2001, val: !userId } // "userId required"
  );

  promise
    .then(async () => {
      foundTodo = await db._findOne("todos", { _id: todoId });
      if (!foundTodo) {
        return Promise.reject(3003); // "To-do not found"
      }
      return foundTodo[0];
    })
    .then(async (note) => {
      await db.delete("todos", { _id: todoId });
    })
    .then(async () => {
      return await db.update(
        "users",
        { _id: foundTodo.creator },
        { $pull: { todos: todoId } }
      );
    })
    .then((updateData) => {
      if (!updateData) {
        return Promise.reject(3006); // "Failed to delete to-do"
      }
      helper.success(res, { msg: "Deleted Successfully!" });
    })
    .catch((e) => {
      helper.error(res, e);
    });
};

todos.createNote = async (req, res, next) => {
  var { userId } = req.uSession;
  const { title, description, priority, dueDate, category } = req.body.formData;
  let user;
  let newNote = {
    title,
    description,
    priority,
    dueDate,
    category,
    creator: userId,
  };

  let promise = helper.paramValidate(
    { code: 2001, val: !title },
    { code: 2001, val: !description },
    { code: 2001, val: !priority },
    { code: 2001, val: !category },
    { code: 2002, val: !dueDate }
  );

  promise
    .then(async () => {
      return await db._find("users", { _id: userId });
    })
    .then(async (foundUser) => {
      if (!foundUser) {
        return Promise.reject(2007); // "User not found"
      }
      user = foundUser[0];
      newNote.creatorName = user.name;
      newNote.role = user.role;
      return await db.insert("todos", newNote);
    })
    .then(async (noteId) => {
      if (!noteId) {
        return Promise.reject(3004); // "Failed to create to-do"
      }
      return await db.update(
        "users",
        { _id: userId },
        { $addToSet: { todos: noteId } }
      );
    })
    .then((createdNote) => {
      if (!createdNote) {
        return Promise.reject(3004); // "Failed to create to-do"
      }
      helper.success(res, { msg: "Success" });
    })
    .catch((e) => {
      helper.error(res, e);
    });
};

todos.updateNote = async (req, res, next) => {
  var { todoId } = req.params;
  var { userId } = req.uSession;
  const { title, description, priority, category, dueDate } = req.body;

  const updateData = {
    title,
    description,
    priority,
    category,
    dueDate,
  };

  let promise = helper.paramValidate(
    { code: 2001, val: !userId },
    { code: 2001, val: !title },
    { code: 2001, val: !description },
    { code: 2001, val: !priority },
    { code: 2001, val: !category },
    { code: 2002, val: !dueDate }
  );

  promise
    .then(async () => {
      const updatedTodo = await db.update("todos", { _id: todoId }, updateData);
      if (!updatedTodo) {
        return Promise.reject(3005);
      }
      helper.success(res, { msg: "Updated Successfully!" });
    })
    .catch((e) => {
      helper.error(res, e);
    });
};

module.exports = function (app, uri) {
  todosRouter.get("/getTodos", todos.getTodos);
  todosRouter.get("/delete/:todoId", todos.deleteTodo);
  todosRouter.post("/add", todos.createNote);
  todosRouter.post("/update/:todoId", todos.updateNote);

  app.use(uri, todosRouter);
};
