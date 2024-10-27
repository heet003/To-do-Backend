// //---Define Collection or Table Name---//
// const CUSTOMER = "Customer";
const ACCESSTOKEN = "AccessToken";
// //-------------------------------------//

//to hash db password
let md5 = function (str) {
  var MD5 = require("md5");
  return MD5("some_salt_and_pepper_" + str + "_sds_2024");
};

//base64 ecoding and decoding
let base64 = {
  encode: function encode(buffer) {
    return buffer
      .toString("base64")
      .replace(/\+/g, "-") // Convert '+' to '-'
      .replace(/\//g, "_") // Convert '/' to '_'
      .replace(/=+$/, ""); // Remove ending '='
  },
  decode: function decode(base64) {
    // Add removed at end '='
    base64 += Array(5 - (base64.length % 4)).join("=");
    base64 = base64
      .replace(/\-/g, "+") // Convert '-' to '+'
      .replace(/\_/g, "/"); // Convert '_' to '/'
    return new Buffer(base64, "base64");
  },
  validate: function validate(base64) {
    return /^[A-Za-z0-9\-_]+$/.test(base64);
  },
};

//get message lang specific
let message = function (code) {
  var m = require("../core/message");
  if (!code in m || isNaN(code)) {
    code = 1001;
  }
  var msg = m[code];
  if (!msg) {
    msg = m[1001];
  }
  return msg;
};

//send error
let error = function (res, code, data, send) {
  console.log("code returned " + code);
  if (!send && send != 0) {
    send = 1;
  }

  if (!data) {
    data = [];
  }

  if (isNaN(code) || code == 0) {
    code = 1001;
  }

  var err = message(code);

  errtxt = { code: code, message: err.message };

  if (send == 1) {
    res.statusCode = err.httpCode;
    res.json(errtxt);
    res.end();
  } else {
    return Promise.reject(errtxt);
  }
};

//send success response
let success = function (res, data, code) {
  if (!data) {
    data = [];
  }
  if (code > 0) {
    var m = message(code);
    res.json({ code: 0, message: m.message, data: data });
  } else {
    res.json(data);
  }
  //res.json({ code: 0, message: message, data: data });
};

//validate request param
let paramValidate = function () {
  let resCode = 0;

  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i].val) {
      resCode = arguments[i].code;
      break;
    }
  }

  if (resCode > 0) {
    return Promise.reject(resCode);
  }
  return Promise.resolve();
};

//check is email valide or not
let isValidEmail = function (email) {
  var re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

//isExist
let isExist = function (collectionName, condition) {
  let db = require("../lib/database");
  return db.findOne(collectionName, condition).then((d) => {
    return Promise.resolve(d.length);
  });
};

//db utc date formate
let dbDate = function () {
  var moment = require("moment");
  return new Date(moment().utc().toISOString());
  //.format("YYYY-MM-DD HH:mm:ss.SSS");
};

let dbDateToUtc = function (date, isBeforeDay = false) {
  var moment = require("moment");
  if (isBeforeDay) {
    return moment.utc(date, "YYYY-MM-DD HH:mm:ss").subtract(1, "days");
  } else {
    return moment.utc(date, "YYYY-MM-DD HH:mm:ss");
  }
};

let dbDateAddTime = function (time) {
  var moment = require("moment");
  if (time.constructor != Number) {
    time = moment();
  } else {
    time = moment() + time;
  }
  return new Date(moment(time).utc().toISOString());
  //.format("YYYY-MM-DD HH:mm:ss.SSS");
};

let dbDateSubTime = function (time) {
  var moment = require("moment");
  if (time.constructor != Number) {
    time = moment();
  } else {
    time = moment() - time;
  }
  return new Date(moment(time).utc().toISOString());
  //.format("YYYY-MM-DD HH:mm:ss.SSS");
};

let parseToDbDate = function (date) {
  var moment = require("moment");
  return new Date(moment.utc(date, "YYYY-MM-DD HH:mm:ss").toISOString());
  //.format("YYYY-MM-DD HH:mm:ss.SSS");
};

let parseToDbDateIso = function (date) {
  var moment = require("moment");
  return `ISODate('${moment
    .utc(date, "YYYY-MM-DD HH:mm:ss")
    .toISOString()}+00:00')`;
  //.format("YYYY-MM-DD HH:mm:ss.SSS");
};

let parseToDbDateWithRandomTime = function (date) {
  var moment = require("moment");
  return new Date(
    moment
      .utc(date, "YYYY-MM-DD HH:mm:ss")
      .set({
        minute: randomDV(1, 50),
        second: randomDV(1, 55),
        millisecond: randomDV(1, 100),
      })
      .toISOString()
  );
  //.format("YYYY-MM-DD HH:mm:ss.SSS");
};

let parseToDbDateStartOfTheDay = function (date) {
  var moment = require("moment");
  _dt = new Date(moment(date, "YYYY-MM-DD 00:01:00").toISOString());
  return new Date(_dt.getFullYear(), _dt.getMonth(), _dt.getDate(), 0, 1, 0, 0);
};

let parseToDbDateEndOfTheDay = function (date) {
  var moment = require("moment");
  _dt = new Date(moment(date, "YYYY-MM-DD 23:59:00").toISOString());
  return new Date(
    _dt.getFullYear(),
    _dt.getMonth(),
    _dt.getDate(),
    23,
    59,
    0,
    0
  );
};

let parseToDbDateTimeZone = function (
  date,
  timeZone = "UTC",
  format = "YYYY-MM-DD HH:mm:ss"
) {
  console.log(
    "date=" + date + ", timeZone=" + timeZone + ", format=" + format + ""
  );
  var moment = require("moment-timezone");

  if (!format) {
    format = "YYYY-MM-DD HH:mm:ss";
  }

  let m = moment(date, format);
  if (timeZone == "UTC" && format.indexOf("YYYY-MM-DDTHH:mm:ss+-HH:mm") == -1) {
    if (format == "Timestamp") {
      date = parseInt(date);
      m = moment(new Date(date));
    } else {
      m = moment().utc(date, format);
    }
  }
  if (
    (timeZone && timeZone != "UTC") ||
    format.indexOf("YYYY-MM-DDTHH:mm:ss+-HH:mm") != -1
  ) {
    if (format.indexOf("YYYY-MM-DDTHH:mm:ss+-HH:mm") != -1) {
      m = moment.tz(date, timeZone);
    } else {
      m = moment.tz(date, format, timeZone);
    }
  }
  return new Date(m.utc().toISOString());
  //.format("YYYY-MM-DD HH:mm:ss.SSS");
};

let parseTimeZoneToUserTZ = (dateTime, utcOffSet = "+00:00") => {
  const moment = require("moment");
  let a = moment
    .utc(dateTime)
    .utcOffset(utcOffSet)
    .format("YYYY-MM-DDTHH:mm:ss.SSS");
  return a + "Z";
};

let parseIsoToUtc = (date) => {
  var moment = require("moment");
  let m = moment(date);
  return m.utc().format("YYYY-MM-DD HH:mm:ss");
};

//log error or message after response or which is neccesary
let log = function (log) {
  console.log(log);
};

let token = {
  get: function (id) {
    let jwt = require("jsonwebtoken");
    return jwt.sign(id, process.env.JWT_TOKEN);
  },
  verify: function (req) {
    try {
      let jwt = require("jsonwebtoken");
      let db = require("../lib/database");
      let moment = require("moment");

      //read header
      let auth = req.headers["authorization"];
      if (!auth) {
        return Promise.reject();
      }
      let token = auth.split(/\s+/).pop();

      //
      let user = jwt.verify(token, process.env.JWT_TOKEN);

      if (!user || !user.tokenId) {
        return Promise.reject(401);
      }

      //validate user
      return db.findOne(ACCESSTOKEN, { _id: user.tokenId }).then((dt) => {
        if (dt.length == 0) {
          return Promise.reject(401);
        }

        //check token is live
        let d = dt[0];
        let ttl = moment.utc(moment.utc(d.created) + d.ttl);
        let created = moment.utc(d.created);
        if (!moment.utc().isBetween(created, ttl)) {
          return Promise.reject(401);
        }
        return Promise.resolve(user);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  },
  TTL: function () {
    //one week token
    //mili*sec*hour*hour in day*no of day
    return 1000 * 60 * 60 * 24 * 7;
  },
};

//generate random Password
let generatePassword = () => {
  var length = 8,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

let superAdminRoleId = () => {
  //super admin id will be same becase
  //we are useing same id in default data
  //please change below id if you are changing in default data
  return Promise.resolve("5a41fd588bca800604b140cc");
};

let activityLog = (
  userType,
  userId,
  action,
  section,
  sectionElementID,
  data
) => {
  //TODO
};

let validateTime = (time) => {
  let moment = require("moment");
  if (moment(time, "HH:mm:ss").format("HH:mm:ss") == time) {
    return 1;
  }
  return 0;
};

let validateDate = (date) => {
  let moment = require("moment");
  if (
    moment(date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") == date
  ) {
    return 1;
  }
  return 0;
};

let validateIP = (ip) => {
  // return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(
  //   ip
  // );

  return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(
    ip
  );
};

let validateMac = (mac) => {
  return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
};

let validateHost = (host) => {
  return /^(?!:\/\/)([a-zA-Z0-9-]+\.){0,5}[a-zA-Z0-9-][a-zA-Z0-9-]+\.[a-zA-Z]{2,64}?$/.test(
    host
  );
};

let timeBetween = (created, ttl) => {
  const moment = require("moment");
  ttl = moment.utc(moment.utc(created) + ttl);
  created = moment.utc(created);
  if (!moment.utc().isBetween(created, ttl)) {
    return Promise.resolve(0);
  }
  return Promise.resolve(1);
};

let validateFromToDate = (from, to) => {
  const moment = require("moment");
  from = moment.utc(from);
  to = moment.utc(to);
  if (from < to) {
    return 1;
  }
  return 0;
};

let isFutureDate = (date) => {
  const moment = require("moment");
  date = moment.utc(date);
  cu = moment.utc();
  if (cu < date) {
    return 1;
  }
  return 0;
};

let getTimeFromDate = (date) => {
  const moment = require("moment");
  if (typeof date != "string") {
    try {
      let d = date.toISOString();
      date = d;
    } catch (e) {}
  }

  return moment(date, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]").format("HH:mm:ss");
};

let getTimeStampFromTime = (date) => {
  const moment = require("moment");
  return moment.utc("1970-01-01 " + date, "YYYY-MM-DD HH:mm:ss").unix();
};

let getDayOfWeekFromDate = (date) => {
  const moment = require("moment");
  return moment.utc(date).format("E");
};

let getDateDiff = (date1, date2) => {
  const moment = require("moment");
  return Math.abs(moment(date1).unix() - moment(date2).unix());
};

let getDayOfWeekFromDateISO = (date) => {
  const moment = require("moment");
  return moment(date).isoWeekday();
};

let convertDate = (date, format) => {
  const moment = require("moment");
  return moment(date, format);
};

let getFirstDateOfYear = (year) => {
  const moment = require("moment");
  var start = new Date("1/1/" + year);
  return moment(start.valueOf());
};

let getFirstDateOfYearByWeekday = (year, weekday) => {
  const moment = require("moment");

  //if start date of year's day of week is greater than
  //passed one than apply below calculation so we can we proper date we need for year
  //e.g. 2019 - tuesday 2, passed one is 1 then moment gives date as 30 sun dec 2018
  //but we need 6 sun 2019
  var start = new Date("1/1/" + year);
  if (weekday < start.getDay()) {
    weekday = start.getDay() + (7 - start.getDay());
  }
  return moment().year(year).month(0).date(0).weekday(weekday);
};

let validateHexColor = (color) => {
  return /^(#)?([0-9a-fA-F]{3})([0-9a-fA-F]{3})?$/.test(color);
};

let getRandomColor = () => {
  // var letters = 'BCDEF'.split('');
  // var color = '#';
  // for (var i = 0; i < 6; i++) {
  //     color += letters[Math.floor(Math.random() * letters.length)];
  // }
  // let hex = color.replace('#', '');
  // let r = parseInt(hex.substring(0, 2), 16);
  // let g = parseInt(hex.substring(2, 4), 16);
  // let b = parseInt(hex.substring(4, 6), 16);
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

let getRandomLightColor = () => {
  var letters = "BCDEF".split("");
  var color = "#";
  for (var i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * letters.length)];
  return color;
};

let validateBooleanType = (val) => {
  return val && typeof val === "boolean" ? true : false;
};

let getOffsetDateTime = (
  dateTime,
  offsetV,
  isAdd,
  dateFormat = "YYYY-MM-DD HH:mm:ss"
) => {
  let dateTimeV;
  const moment = require("moment");

  if (dateTime && offsetV) {
    if (!isAdd)
      offsetV =
        offsetV.charAt(0) == "+"
          ? offsetV.replace("+", "-")
          : offsetV.replace("-", "+");

    dateTimeV = moment.utc(dateTime).utcOffset(offsetV).format(dateFormat);
  }

  return dateTimeV;
};

//Will return int number from 1 to 7 where 1st is for Sunday;
let getWeekDay = (dateTime) => {
  const moment = require("moment");
  return moment(dateTime).isoWeekday(1).day();
};

//get day difference in int
let getDayDifference = (dateFrom, dateTo) => {
  const moment = require("moment");
  if (validateFromToDate(dateFrom, dateTo))
    return moment(dateTo).diff(moment(dateFrom), "days");
  else return 0;
};

let getHHmmFromSecs = (secs, offsetV) => {
  let HHmm;
  const moment = require("moment");
  if (offsetV) {
    HHmm = moment.unix(secs).utcOffset(offsetV).format("HH:mm");
  } else
    HHmm = moment("1970-01-01").startOf("day").seconds(secs).format("HH:mm");
  return HHmm;
};

let getOffsetAddInHHMM = (
  time,
  dateF,
  offSetInMins,
  addBy = "minutes",
  resFormat
) => {
  const moment = require("moment");
  return moment(time, dateF).add(offSetInMins, addBy).format(resFormat); //("HH:mm");
};

let getColorTheme = (color, i = 0) => {
  let colorHex = "#ADD9FE";

  const colorTheme = {
    "#E7126E": [
      "#E7126E",
      "#FF1803",
      "#F9667A",
      "#FF6057",
      "#EB3E5C",
      "#DA1131",
      "#CD1459",
      "#F87B9F",
      "#FF4B86",
      "#E81345",
      "#F5B4C5",
      "#FF3396",
      "#B00C3E",
      "#E64C83",
    ],
    "#007690": [
      "#007690",
      "#0FA3A2",
      "#11BEB3",
      "#549C9D",
      "#45E6D8",
      "#8DFEDE",
      "#00FDFF",
      "#55D0AB",
      "#40FEE2",
      "#55FED5",
      "#92EFE7",
      "#9BE7F1",
      "#BAFEFF",
      "#9BE7F1",
    ],
    "#002750": [
      "#002750",
      "#36439A",
      "#162E9E",
      "#1C3CD3",
      "#3773D1",
      "#4F79F9",
      "#305FE9",
      "#65A2FB",
      "#0090F3",
      "#1A52A7",
      "#1A52A7",
      "#1A52A7",
      "#5E9DDB",
      "#008CDC",
    ],
    "#7F186E": [
      "#7F186E",
      "#83366D",
      "#902F64",
      "#96345C",
      "#AF1F6D",
      "#C14C8A",
      "#AF1F6D",
      "#742365",
      "#AF1F6D",
      "#79248B",
      "#AF1F6D",
      "#79248B",
      "#B33D92",
      "#AD88BF",
    ],

    //Cyan 50
    "#ADD9FE": [
      "#ADD9FE",
      "#E0F7FA",
      "#B2EBF2",
      "#80DEEA",
      "#4DD0E1",
      "#26C6DA",
      "#00BCD4",
      "#00ACC1",
      "#0097A7",
      " #00838F",
      "#006064",
      "#84FFFF",
      "#18FFFF",
      "#00E5FF",
      "#00B8D4",
    ],

    //Lime 50
    "#FFC046": [
      "#FFC046",
      "#F9FBE7",
      "#F0F4C3",
      "#E6EE9C",
      "#DCE775",
      "#D4E157",
      "#CDDC39",
      "#F4FF81",
      "#EEFF41",
    ],

    //Pink 50
    "#FFCDD2": ["#FFCDD2", "#FCE4EC", "#F8BBD0", "#F48FB1", "#F06292"],

    //Teal 50
    "#77DD77": [
      "#77DD77",
      "#E0F2F1",
      "#B2DFDB",
      "#80CBC4",
      "#4DB6AC",
      "#26A69A",
      "#A7FFEB",
      "#64FFDA",
      "#1DE9B6",
    ],

    //Gray 50
    "#FAFAFA": [
      "#FAFAFA",
      "#F5F5F5",
      "#EEEEEE",
      "#E0E0E0",
      "#BDBDBD",
      "#9E9E9E",
      "#424242",
      "#CFD8DC",
      "#B0BEC5",
      "#90A4AE",
      "#607D8B",
    ],

    //Deep Orange 50
    "#FBE9E7": [
      "#FBE9E7",
      "#FFCCBC",
      "#FFAB91",
      "#FF8A65",
      "#FF9E80",
      "#FF6E40",
    ],

    //Indigo 50
    "#E8EAF6": [
      "#E8EAF6",
      "#C5CAE9",
      "#9FA8DA",
      "#8C9EFF",
      "#7986CB",
      "#5C6BC0",
    ],

    //Light Blue 50
    "#E1F5FE": [
      "#E1F5FE",
      "#B3E5FC",
      "#81D4FA",
      "#4FC3F7",
      "#80D8FF",
      "#40C4FF",
      "#00B0FF",
    ],

    //Light Green 50
    "#F1F8E9": [
      "#F1F8E9",
      "#DCEDC8",
      "#C5E1A5",
      "#AED581",
      "#9CCC65",
      "#CCFF90",
      "#B2FF59",
      "#64DD17",
    ],

    //Brown 50
    "#EFEBE9": ["#EFEBE9", "#D7CCC8", "#BCAAA4", "#A1887F", "#8D6E63"],

    //Black
    "#000000": [
      "#000000",
      "#000000",
      "#000000",
      "#000000",
      "#000000",
      "#000000",
      "#000000",
      "#000000",
      "#000000",
      "#000000",
      "#000000",
    ],

    //White
    "#FFFFFF": [
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
      "#FFFFFF",
    ],
  };

  try {
    const hexLength = colorTheme[color].length
      ? colorTheme[color].length
      : colorTheme[colorHex].length;
    const remainder = i % hexLength;
    colorHex = colorTheme[color][remainder];
  } catch (err) {
    colorHex = color ? color : colorHex;
  }

  return colorHex;
};

let onlyUnique = function (a) {
  a = a.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });

  return a;
};

let shadeColor = function (color, percent) {
  var R = parseInt(color.substring(1, 3), 16);
  var G = parseInt(color.substring(3, 5), 16);
  var B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  var RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
  var GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
  var BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
};

let randomDV = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

let parserJsonXml = {
  toJson: function (xml) {
    return new Promise(function (resolve, reject) {
      var to_json = require("xmljson").to_json;
      to_json(xml, (err, data) => {
        if (err) reject();

        resolve(data);
      });
    });
  },
  toXml: function (json) {
    return new Promise(function (resolve, reject) {
      var to_xml = require("xmljson").to_xml;
      to_xml(json, (err, data) => {
        if (err) reject();

        resolve(data);
      });
    });
  },
};

let formatValue = function (n, _s, _d) {
  return n
    .toFixed(2)
    .replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1" + _s)
    .replace(".", _d);
};

let parseDateStringToIso = function (date) {
  return date.replace("T", " ").slice(0, -6);
};

let compareDate = function (date1, date2) {
  const moment = require("moment");
  date1 = moment
    .utc(date1, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]")
    .format("DD/MM/YYYY");
  date2 = moment
    .utc(date2, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]")
    .format("DD/MM/YYYY");
  return date1 == date2;
};

const helper = {
  md5,
  base64,
  error,
  success,
  paramValidate,
  isValidEmail,
  isExist,
  dbDate,
  dbDateToUtc,
  dbDateAddTime,
  dbDateSubTime,
  parseToDbDate,
  parseToDbDateWithRandomTime,
  parseToDbDateStartOfTheDay,
  parseToDbDateEndOfTheDay,
  parseToDbDateTimeZone,
  parseIsoToUtc,
  log,
  token,
  generatePassword,
  superAdminRoleId,
  activityLog,
  validateTime,
  validateIP,
  validateMac,
  validateHost,
  timeBetween,
  validateDate,
  validateBooleanType,
  isFutureDate,
  parseToDbDateIso,
  validateFromToDate,
  getTimeFromDate,
  getTimeStampFromTime,
  getDayOfWeekFromDate,
  getDateDiff,
  validateHexColor,
  getRandomColor,
  getRandomLightColor,
  getColorTheme,
  onlyUnique,
  parserJsonXml,
  convertDate,
  getDayOfWeekFromDateISO,
  getOffsetDateTime,
  getFirstDateOfYear,
  getFirstDateOfYearByWeekday,
  getWeekDay,
  getDayDifference,
  getHHmmFromSecs,
  parseTimeZoneToUserTZ,
  getOffsetAddInHHMM,
  shadeColor,
  formatValue,
  parseDateStringToIso,
  compareDate,
};

module.exports = helper;
