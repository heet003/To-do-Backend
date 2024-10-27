module.exports = function (app){
    require('../middleware/authentication')(app);
}