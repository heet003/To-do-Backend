var helper = require("../../../core/helper");

// let url = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
let url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.umdmyvs.mongodb.net/${process.env.DB_DATABASE}`;

const Mongo = require("mongodb");
const MongoClient = Mongo.MongoClient;

var db = {};
var dbCon = null;

var dbFn = function () {
  return new Promise(function (fulfill, reject) {
    if (dbCon == null) {
      MongoClient.connect(url)
        .then(function (client) {
          dbCon = client.db(process.env.DB_DATABASE);
          helper.log("database connected");
          fulfill(dbCon);
        })
        .catch(function (err) {
          helper.log(err);
          reject(1001);
        });
    } else {
      fulfill(dbCon);
    }
  });
};
dbFn();

//change objectId
var getInsertId = function () {
  var objectId = new Mongo.ObjectId();
  // TODO: objectId.toString() will do the job rather base64 encode
  return helper.base64.encode(objectId.toHexString());
};

db._find = function (
  collectionName,
  condition,
  project,
  sort,
  page,
  limit,
  skip
) {
  return new Promise(function (fulfill, reject) {
    //condition to check
    if (!condition) {
      condition = "";
    }

    //project on document
    if (!project) {
      project = {};
    }

    let find = dbCon
      .collection(collectionName)
      .find(condition)
      .project(project);

    //sort if key provided
    if (sort) {
      find = find.sort(sort);
    }

    //limit records if page provided
    if (!limit) {
      limit = process.env.DB_LIMIT_RECORD;
    }

    if (page) {
      find = find.limit(limit).skip(limit * (page - 1));
    }

    if (skip) {
      find = find.skip(skip);
    }

    find.toArray().then(
      function (data) {
        fulfill(data);
      },
      function (err) {
        reject(1001);
      }
    );
  });
};

db._findOne = function (collectionName, condition, project, sort) {
  return new Promise(function (fulfill, reject) {
    if (!condition) {
      condition = {};
    }
    if (!project) {
      project = {};
    }

    let find = dbCon
      .collection(collectionName)
      .find(condition)
      .project(project);

    if (sort) {
      find = find.sort(sort);
    }

    find
      .limit(1)
      .toArray()
      .then(
        function (data) {
          fulfill(data);
        },
        function (err) {
          reject(1001);
        }
      );
  });
};

db.insert = function (collectionName, data, id) {
  return new Promise(function (fulfill, reject) {
    if (id != false) {
      id = true;
    }
    if (id) {
      data._id = getInsertId();
    }
    //insert to insertOne
    dbCon
      .collection(collectionName)
      .insertOne(data)
      .then(
        function (d) {
          fulfill(data._id);
        },
        function (err) {
          reject(1001);
        }
      );
  });
};

db.insertMany = function (collectionName, data, cid = 1) {
  return new Promise(function (fulfill, reject) {
    if (!data) {
      reject(1001);
      return;
    }
    if (cid == 1) {
      for (var i = 0; i < data.length; i++) {
        data[i]._id = getInsertId();
      }
    }
    // console.log(data);

    //insert to insertMany
    dbCon
      .collection(collectionName)
      .insertMany(data)
      .then(
        function (d) {
          fulfill(d.insertedIds);
        },
        function (err) {
          console.log(err);
          reject(1001);
        }
      );
  });
};

db.update = function (collectionName, condition, update) {
  return new Promise(function (fulfill, reject) {
    if (
      !("$push" in update) &&
      !("$addToSet" in update) &&
      !("$pull" in update) &&
      !("$inc" in update)
    ) {
      update = { $set: update };
    }
    //update to updateMany
    dbCon
      .collection(collectionName)
      .updateMany(condition, update)
      .then(
        function (data) {
          fulfill(data);
        },
        function (err) {
          reject(1001);
        }
      );
  });
};

db.delete = function (collectionName, condition, multi) {
  return new Promise(function (fulfill, reject) {
    if (condition == {} || !condition) {
      reject(1001);
      return;
    }
    var action = "deleteOne";
    if (multi == 1) {
      action = "deleteMany";
    }
    dbCon
      .collection(collectionName)
      [action](condition)
      .then(
        function () {
          fulfill();
        },
        function (err) {
          reject(err);
        }
      );
  });
};

db._count = function (collectionName, condition) {
  return new Promise(function (fulfill, reject) {
    if (condition == {} || !condition) {
      condition = {};
    }
    dbCon
      .collection(collectionName)
      .countDocuments(condition)
      .then(
        function (count) {
          fulfill(count);
        },
        function (err) {
          reject(err);
        }
      );
  });
};

db.aggregate = function (collectionName, match, group, sort, hint = "") {
  return new Promise(function (fulfill, reject) {
    if (!match) {
      match = {};
    }
    if (!sort) {
      sort = {};
    }
    let additonal_params = { allowDiskUse: true };
    if (hint != "") additonal_params["hint"] = hint;
    dbCon
      .collection(collectionName)
      .aggregate(
        [
          {
            $match: match,
          },
          {
            $group: group,
          },
          {
            $sort: sort,
          },
        ],
        additonal_params
      )
      .toArray()
      .then(
        function (data) {
          fulfill(data);
        },
        function (err) {
          reject(err);
        }
      );
  });
};

db.aggregateByQuery = function (collectionName, query) {
  return new Promise(function (fulfill, reject) {
    dbCon
      .collection(collectionName)
      .aggregate(query, { allowDiskUse: true })
      .toArray()
      .then(
        function (data) {
          fulfill(data);
        },
        function (err) {
          reject(err);
        }
      );
  });
};

db.updateBulkRecords = function (collectionName, query) {
  return new Promise(function (fulfill, reject) {
    if (query.length == 0 || !query) {
      reject(1001);
      return;
    }
    dbCon
      .collection(collectionName)
      .bulkWrite(query)
      .then(
        function (d) {
          fulfill(d);
        },
        function (err) {
          reject(1001);
        }
      );
  });
};

module.exports = db;
