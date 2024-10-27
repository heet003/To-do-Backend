// if (process.env.DB_DRIVER != "mongodb") {
//   new Error("Invalid db driver");
// }

var db = require("./mongodb/index");

db.smartFind = (req, collectionName, condition, scope) => {
  let query = req.query;

  let project = {};
  /***
   * Field scoping:
   *
   * Taking fields from get url with scope restriction
   * because of this use will able to project to database
   * as use wanted
   *
   * e.g. ?fields=column1,column2
   * */
  if (query.fields) {
    let f = query.fields.split(",");
    if (f.length > 0) {
      f.forEach((v) => {
        if (scope.includes(v)) {
          project[v] = 1;
        }
      });
    }
  } else {
    //if project is not provided return all scope as project
    scope.forEach((v) => {
      project[v] = 1;
    });
  }

  let page = 0;
  /***
   * Page Number:
   *
   * By taking page param we are exposing paging feature to user
   *
   * e.g. ?page=1
   * */
  if (query.page && query.page > 0) {
    page = parseInt(query.page);
  }

  let limit = 50;
  /***
   * Limit Records:
   *
   * It will return number records per page
   *
   * e.g. ?limit=1
   * */
  if (query.limit && query.limit > 0 && query.limit < 201) {
    limit = parseInt(query.limit);
  }

  let sort = { created: -1 };
  /***
   * Sort Records:
   *
   * It will sort records. pass column name with - order of the column
   * for descending use desc and for ascending use asc
   *
   * e.g. ?sort=column-order
   * */
  if (query.sort) {
    sort = {};
    let s = query.sort.split("-");
    if (s.length == 2 && scope.includes(s[0])) {
      if (s[1] == "asc") {
        sort[s[0]] = 1;
      } else {
        sort[s[0]] = -1;
      }
    }
  }

  /***
   * Where Condition:
   *
   * User can query on allow data in query param it self
   * For normal where condition use below query param
   * e.g. ?where[column]=exact-string-to-match
   *
   * */
  if (query.where && query.where.constructor == Object) {
    let where = query.where;
    for (var w in where) {
      if (scope.includes(w) || w == "_id") {
        if (where[w] && !isNaN(where[w])) {
          condition[w] = parseInt(where[w]);
        } else if (where[w].constructor == String) {
          condition[w] = new RegExp(where[w], "i");
        } else if (where[w].constructor == Array) {
          condition[w] = { $in: where[w] };
        }
      }
    }
  }

  let count = 0;
  if (query.count == 1) {
    count = 1;
  }
  if (count) {
    return db._count(collectionName, condition).then((c) => {
      return Promise.resolve({ count: c });
    });
  } else {
    return db._find(collectionName, condition, project, sort, page, limit);
    // sort, page, limit, skip
  }
};

db.find = function (uSession, condition, project, sort, page, limit, skip) {
  let collectionName = "";
  if (typeof uSession == "object") {
    collectionName = uSession.collectionName;
  } else {
    collectionName = uSession;
    uSession = {};
  }

  return db._find(collectionName, condition, project, sort, page, limit, skip);
};

db.findOne = function (uSession, condition, project, sort) {
  let collectionName = "";
  if (typeof uSession == "object") {
    collectionName = uSession.collectionName;
  } else {
    collectionName = uSession;
    uSession = {};
  }

  return db._findOne(collectionName, condition, project, sort);
};

db.count = function (uSession, condition) {
  let collectionName = "";
  if (typeof uSession == "object") {
    collectionName = uSession.collectionName;
  } else {
    collectionName = uSession;
    uSession = {};
  }

  return db._count(collectionName, condition);
};

module.exports = db;
