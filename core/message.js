if (process.env.LANG != "en") {
  process.env.LANG = "en";
}

const m = require(`../lang/${process.env.LANG}/${process.env.LANG}`);

module.exports = m;
