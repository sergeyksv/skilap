// require('look').start();
//"Подгружаем" модуль "skilap-core" в переменную
var main = require('skilap-core');
//странный аргумент "automated" может отладка какая
if (process.argv[2]=="automated") {
    process.on("message",function (msg) {
		if (msg.c == "startapp") {
			var app = main.createApp(msg.data);
			app.startApp(__dirname+"/data",function (err) {
				process.send({c:"startapp_repl",data:err})
			});
		}
	})

} else {

	var app = main.createApp();
	app.startApp(__dirname+"/data",function (err) {
		if (err) console.log(err);
	});
	module.exports = app;
}
