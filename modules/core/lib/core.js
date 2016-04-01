/**
 * Core
 */
var fs = require("fs");
var path = require("path");
var _ = require('underscore');

var async = require('async');
var Step = require("step");
var events = require("events");
var util = require("util");
var express = require('express');
var SkilapError = require("skilap-utils").SkilapError;
var Gettext = require("../vendor/Gettext");
var i18n = require('pok_utils');
var ApiBatch = require('./batch.js');
var vstatic = require('pok_utils').vstatic;
var handlebarsEngine = require('pok_utils').handlebarsEngine;
var Handlebars = require('handlebars');
var safe = require('safe')
var deepExtend = require('deep-extend');
var moment = require("moment");

function Skilap(config_) {
	var self = this;
	var sessions = {};
	var i18l = {};
	var _adb = null;
	var tmodules = [
		{name:"core", require:"./coreapi"},
		{name:"cash", require:"skilap-cash"}
		];
	var self = this;
	var modules = {};
	var webapp = null;
	var core_users = null;
	var core_clients = null;
	var storepath;
	this.webapp;

	this.startApp = function (storepath_, cb) {
		process.on('uncaughException', function (e) {
			console.log(e);
			console.trace();
		});
		console.time("startApp");
		storepath = storepath_;
		async.series([
			function initBasics(cb1) {
				var app = module.exports = express();

				// Configuration
				app.configure(function(){
					app.set('view engine', 'mustache');				
					app.engine('mustache', handlebarsEngine(Handlebars,{dest:"../../public/hbs",debug:false}));
					app.use(express.bodyParser());
					app.use(express.methodOverride());
					app.use(express.cookieParser());
					app.use(express.session({ secret: 'PushOk' }));
					app.use(vstatic(__dirname + '/../../../public',{vpath:"/common"}));
					app.use(function (req, res, next) {
						if (!req.cookies['skilapid']) {
							var clientId; 
							self.getRandomString(128, function (err, rnd) { clientId = rnd; });
							res.cookie('skilapid',clientId, { maxAge: 1000*60*60*24*5, path: '/' });
							res.cookie('sguard','1', { maxAge: 1000*60*60*24*5, path: '/', secure:true });
						}
						async.series([
							function ensureToken (cb3) {
								if (req.session.apiToken==null) {
									modules['core'].api.getApiToken('default',req.cookies['skilapid']||clientId,'fake',function (err, apiToken) {
										req.session.apiToken = apiToken;
										cb3();
									});
								} else cb3();
							}],	function secureGuard (err) {
								modules['core'].api.getUser(req.session.apiToken, function (err, user) {/*
									if (user.type != 'guest' && req.cookies['sguard']==null) {
										console.log('Redirect to secure');
										res.redirect('https://'+req.headers.host+req.url);
									} else */next();
								});
							}
						);
					});
					// common data grabber
					app.use(function (req, res, next) {
						modules['core'].api.getUser(req.session.apiToken, function (err, user) {
							if (err) return next(err);
							if (!user.language) {
								// guess language 
								var al = req.headers['accept-language'];
								if (_.isUndefined(al))
									al = "en-US";
								var re = al.match(/\w\w-\w\w/i);
								var guesslang = null;
								user.language = (re ? re[0].substr(0, 2)+'_'+re[0].substr(3, 2).toUpperCase() : 'en_US')
								modules['core'].api.saveUser(req.session.apiToken,user, function () {});
							}
							if (user.password) delete user.password;
							user.loggedin = user.type!='guest';
							res.locals.user = user;
							next();
						});
					});					
					app.use(function (req, res, next) {
						var domain, re = req.url.match(/\/(\w+)[/?#]?/i);						
						domain = re?re[1]:"core";		
						
						Handlebars.registerHelper('prefix', function(options) {
							return "/"+domain;
						});
																
						Handlebars.registerHelper('i18n', function(options) {
							return self.i18n(req.session.apiToken, res.locals.ldomain || domain, options.fn(this));						
						});
												
						Handlebars.registerHelper('i18n_currency', function(iso, value, options) {
							return self.i18n_cytext(req.session.apiToken, iso, value);																									
						});
						
						Handlebars.registerHelper('i18n_date', function (d,options) {
							var f = "L";
							if (d=="format")
								return moment.langData(res.locals.user.language.substr(0,2)).longDateFormat(f).toLowerCase();							
							var r = d.toString();
							try {
								var lm = moment(d);
								if (lm.isValid()){
									lm.lang(res.locals.user.language.substr(0,2));
									r = lm.format(f);
								}
							} catch(e) {};
							return r;
						})							
						
						Handlebars.registerHelper('when', function(lvalue, op, rvalue, options) {
							if (arguments.length < 4)
								throw new Error("Handlerbars Helper 'compare' needs 3 parameters");

							var result = false;
							
							try {
								result = eval(JSON.stringify(lvalue)+op+JSON.stringify(rvalue));
							} catch (err) {
							}

							return result?options.fn(this):options.inverse(this);
						});														
						
						res.locals.uniq = (new Date()).valueOf();
						var user = res.locals.user;
						user.perm = {};
						if (!user.permissions)
							user.permissions = ['core.me.view'];
						_.reduce(user.permissions,function (ctx,val) {
							var fname=val.replace(/\./g,'_');
							ctx[fname]=1;
							return ctx;
						},user.perm);
						delete user.permissions;
						res.locals.user = user;
						res.locals.url = req.url;
						res.locals.apiToken = req.session.apiToken;
						next();
					})		
					
					app.use(app.router);		
					app.use(function (err,req,res,next) {
						if (err instanceof SkilapError && err.data.subject == 'AccessDenied') {
/*							if (req.cookies['sguard']==null) {
								console.log('Log-in should be secure');
								res.redirect('https://'+req.headers.host+req.url);
							} else {  */
								res.render(__dirname+'/../res/views/accessDenied', {layout:"layout",url:req.url}, safe.sure(next, function (text) {
									res.send(403,text);
								}))
/*							} */
						} else next(err);
					});					
											
/*						i18n_domain: function(req, res){
							return function () { return function (text, render) {
								req.skilap.ldomain = text;
								return '';
							};};
						},						*/
				});

				app.configure('development', function(){
				  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
				});

				app.configure('production', function(){
				  app.use(express.errorHandler());
				});

				self.webapp = webapp = app;

			
				app.get("/login", function (req, res, next) {
/*					if (req.cookies['sguard']==null) {
						console.log('Log-in should be secure');
						res.redirect('https://'+req.headers.host+req.url);
					} else { */
						res.render(__dirname+'/../res/views/login', {prefix:'/core',layout:"layout",success:req.query.success || '/',
							failure:"/login?success="+(req.query.success || '/'),error:req.query.error});
/*					} 	*/
				})

				app.post("/login", function (req,res,next) {
					async.series([
						function (cb) { modules['core'].api.loginByPass(req.session.apiToken, req.body.name, req.body.password, cb); }
					], function (err, user) {
						if (err) {
							res.redirect((req.body.failure || '/?')+"&error="+encodeURIComponent(err.message));
						} else
							res.redirect(req.body.success || '/');
					});
				});

				app.get("/logout", function (req, res, next){
					res.clearCookie("skilapid");
					res.clearCookie("sguard");
					modules['core'].api.logOut(req.session.apiToken, function() { 
						req.session.destroy(function () {
							var r = req.param.success || '/';
							res.redirect(r);
						});
					});
				});
				
				function handleJsonRpc(jsonrpc, req, res, next) {
					var startTime = new Date();
					var id = null; var out = false;
					try {
						id = jsonrpc.id;
						var params = jsonrpc.params;
						if (typeof(params) != 'object')
							params = JSON.parse(params);
						var func = jsonrpc.method.match(/^(.*)\.(.*)$/);
						var module = func[1];
						func = func[2];
						var api;
						if (module == 'batch')
							api = self;
						else
							api = modules[module].api;
							
						var fn = api[func];
						params.push(function () {
							var jsonres = {};
							if (arguments[0]) {
								var err = arguments[0];
								jsonres.error = {message: err.message, subject: err.skilap?err.skilap.subject:"GenericError"};
								jsonres.result = null;
							} else {
								jsonres.error = null;
								jsonres.result = Array.prototype.slice.call(arguments,1);
							}
							jsonres.id = jsonrpc.id;
							var reqTime = new Date() - startTime;
							res.send(jsonres);
						})
						fn.apply(api, params);
						out = true;
					} catch (err) {
						console.log(err);
						if (!out) 
							res.send({error:{message:err.message, subject:err.skilap?err.skilap.subject:"GenericError"}, result: null, id:id});
					};
				};

				app.get("/jsonrpc", function (req, res, next) {
					handleJsonRpc(JSON.parse(req.query.jsonrpc), req, res, next);
				})
				app.post("/jsonrpc", function (req,res,next) {
					handleJsonRpc(req.body, req, res, next);
				})
				cb1();
			},
			function initModules(cb) {
				async.forEachSeries(tmodules, function (minfo, cb) {
					console.time(minfo.name);
					var module = require(minfo.require);
					module.init(self,function (err, moduleObj) {
						if (err) return cb(err);
						modules[minfo.name]=moduleObj;
						if (moduleObj.localePath) {
							_.forEach(fs.readdirSync(moduleObj.localePath), function (file) {
								var re = file.match(/.*\.(.*)\.po/i);
								if (re) {
									var lc = re[1];
									if (i18l[lc]==null)
										i18l[lc] = new Gettext();
									var gt = i18l[lc];
									var parsed = gt.parse_po(""+fs.readFileSync(moduleObj.localePath+"/"+file));
									var rv = {}; var domain = minfo.name;
									// munge domain into/outof header
									if (parsed) {
										if (! parsed[""]) parsed[""] = {};
										if (! parsed[""]["domain"]) parsed[""]["domain"] = domain;
										domain = parsed[""]["domain"];
										rv[domain] = parsed;
										gt.parse_locale_data(rv);
									};
								};
							});
						}
						console.timeEnd(minfo.name);
						cb();
					});
				},safe.sure(cb, function () {
					// second pass, allow to set links between modules, all modules are there
					// so they can link to each other					
					async.forEachSeries(_.keys(modules), function (mname, cb) {
						var module = modules[mname];
						if (module.init2) {
							console.time("Init2 "+mname);
							module.init2(safe.sure_result(cb,function () {
								console.timeEnd("Init2 "+mname);
							}))
						}
						else cb();
					},safe.sure(cb, function () {						
						// and now we can init modules that need express app
						async.forEachSeries(_.keys(modules), function (mname, cb) {
							var module = modules[mname];							
							if (module.initWeb) {
								console.time("InitWeb "+mname);
								module.initWeb(webapp,safe.sure_result(cb,function () {
									console.timeEnd("InitWeb "+mname);
								}))
							}
							else cb();
						},cb);
					}))
				}))
			}, 
			function instrumenApi(cb) {
				// comment the line below to get some profile info
				// return cb();
				var debug = false, calls=false;
				if (process.argv[2]) {
					if (process.argv[2]=="profile" || process.argv[2]=="calls")
						debug = true;
					if (process.argv[2]=="calls")
						calls = true;
				}
				if (!debug) return cb();
				var profile = {count:0, total:0, fstat:{}};
				var po = [];
				_.forEach(modules, function (m,mname) {
					po.push({obj:m.api.constructor.prototype,name:mname});
				})
//				po.push({obj:self, name:"ctx"});
				
				_.forEach(po, function (m) {
					var mname = m.name;
					_.forEach(m.obj, function (f,k) {
						if (!_.isFunction(f))
							return;
						var p = function () {
							var start = new Date().valueOf();
							var fname = mname + ":" + k;
							if (calls) console.log(fname + " ...");
							function logend() {
									var end = new Date().valueOf();
									if (calls) console.log(fname + " " + (end-start)+"ms");
									var st = profile.fstat[fname];
									if (!st) {
										profile.fstat[fname]=st={name:fname, count:0, total:0};
									}
									st.count++;
									st.total+=(end-start);
									profile.count++;
									profile.total+=(end-start);
							}
							var cb = arguments[arguments.length-1];
							if (_.isFunction(cb)) {
								// log async time
								arguments[arguments.length-1] = function () {
									// dump any errors
									if (arguments.length>0 && arguments[0]) {
										console.log(arguments[0]);
									}
									logend();
									cb.apply(this,arguments);
								};
							}
							var r = f.apply(this, arguments);
							if (!_.isFunction(cb)) {
								// log sync time
								logend();
							}
							return r;
						}
						m.obj[k] = p;
					});
				})
				setInterval(function () {
					console.log("Profile dump: "+profile.count+" "+profile.total+"ms");
					profile.count = profile.total = 0;
					_.forEach(profile.fstat, function (e) {
						console.log(e);
					});
				}, 10000);
				cb();
			}],
			function end(err) {
				console.timeEnd("startApp");
				if (err) return cb(err);
				self.getConfig(safe.sure(cb, function (cfg) {
					cfg = cfg.app || {};
					var app = express();
					var server, port;
					if (cfg.https) {
						var options = {
							key: fs.readFileSync(path.resolve('./privatekey.pem')),
							cert: fs.readFileSync(path.resolve('./certificate.pem'))
						};
						var https = require('https');
						server = https.createServer(options, app);
						port = 443;
					} else {
						var http = require('http');
						server = http.createServer(app);
						port = 80;
					}
					app.use(webapp);
					if (cfg.port == 'auto' || cfg.port === 0) port = 0;
					else if (cfg.port) port = +cfg.port;
					server.listen(port, cfg.host);
					server.once('listening', function () {
						var host = server.address().address;
						var port = server.address().port;
						console.log('Express server listening on ' + host + ':' + port + ' in ' + webapp.settings.env + ' mode');
						self.emit('WebStarted', port, cfg.https);
						cb();
					});
				}));
			});
	}

	var _db = null;
	this.getDB = function (cb) {
		var self = this;
		// return db if we already have it
		if (_db) return cb(null,_db);
		this.getConfig(safe.sure(cb, function (cfg) {
			if (cfg.app.engine=="mongodb") {
				// open and remember it
				var mongo = require("mongodb")
				var dbc = new mongo.Db(cfg.mongo.db,
					new mongo.Server(cfg.mongo.host, cfg.mongo.port, cfg.mongo.opts), {native_parser: false, safe:true});
				self.ObjectID = mongo.ObjectID;				
			} else {
				var tingo = require("tingodb")({});
				var store = cfg.tingo.path;
				if (store.slice(0, 2) == '~/') {
					var home = process.env.HOME || process.env.USERPROFILE;
					store = home + store.slice(1);
				}
				store = path.resolve(store);
				var mkdirp = require('mkdirp');
				mkdirp.sync(store);
				var dbc = new tingo.Db(store, {});
				self.ObjectID = tingo.ObjectID;
			}
			dbc.open(safe.sure(cb,function(db) {
				_db = db;
				function createSampleUser(cb) {
					if (!cfg.app.demo) return cb();
					db.collection('core_users', safe.sure(cb, function (coll) {
						var doc = {
							firstName: 'John',
							lastName: 'Smith',
							login: 'sample',
							timeZone: '0.0',
							language: 'en_US',
							password: 'sample',
							permissions: [
								"core.me.view",
								"core.me.edit",
								"core.user.view",
								"core.user.edit",
								"core.sysadmin",
								"cash.view",
								"cash.add",
								"cash.edit",
								"task.view",
								"task.add",
								"task.edit"
							],
							screenName: "John S."
						};
						coll.update({ login: doc.login }, doc, { w: 1, upsert: true }, cb);
					}));
				}
				createSampleUser(safe.sure(cb, function () {
					cb(null, _db);
				}));
			}))
		}))
	}

	this.getModule = function (name, cb) {
		cb(null, modules[name]);
	}
	
	this.getModuleSync = function (name) {
		return modules[name];
	}	

	this.getModulesInfo = function (langtoken, cb) {
		var ret = [];
		async.forEachSeries(_(modules).values(), function (module,cb) {
			module.getModuleInfo(langtoken, function (err, mi) {
				module.getPermissionsList(langtoken, function (err, perm) {
					ret.push({id:mi._id, name:mi.name, desc:mi.desc, url:mi.url, permissions:perm});
					cb();
				});
			});
		}, function () {
			cb(null, ret);
		});
	}

	this.getWebApp = function (cb) {
		cb(null, webapp);
	}

	var id = null; var saveTimer = null;
	this.getUniqueId = function(cb) {
		if (id==null) 
			id = parseInt(fs.readFileSync(storepath+"unique._id","utf-8"));
		id++; 
		// save the id, but not right away, not often than once a second
		if (saveTimer==null) {
			saveTimer = setTimeout(function () {
				fs.writeFileSync(storepath+"unique._id",id.toString());
				saveTimer=null;
			}, 1000);
		}
		cb(null,id);
	}

	this.getRandomString = function (bits, cb) {
		var chars, rand, i, ret;
		chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
		ret = '';
		// in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53)
		while (bits > 0) {
			rand = Math.floor(Math.random()*0x100000000); // 32-bit integer
			// base 64 means 6 bits per character, so we use the top 30 bits from rand to give 30/6=5 characters.
			for(i=26; i>0 && bits>0; i-=6, bits-=6) 
				ret += chars[0x3F & rand >>> i];
		}
		cb(null,ret);
	}

	this.i18n = function (langtoken,domain,text1,text2,n)  {
		// 1st guess langtoken is langtoken exactly as it is
		var gt = i18l[langtoken];
		// 2nd guess, langtoken is api token and it can have a language
		if (gt==null) {
			var lc = modules['core'].api.getLanguageSync(langtoken);
			if (lc)
				gt = i18l[lc];
		}
		// 3nd guess, system default
//		if (gt==null)
//			gt = i18l['ru_RU']; // TODO: we need to have system default language
		// final guess, fallback to empty one (dummy)
		if (gt!=null)
			return gt.dgettext(domain, text1);
		else 
			return text1;
	}
	
	this.i18n_cytext = function(langtoken, curId, value) {
		var cur = i18n.currency(curId);
		var res = cur.format(value);
		var m = res.match(/([^0123456789., ]*)([0123456789., ]*)([^0123456789., ]*)/);
		if (m && m.length>3)
			return m[1]+" "+m[2]+ " "+m[3];
		else 
			return res;
	}

	this.i18n_cyval = function(curId,value) {
		var cur = i18n.currency(curId);
		var res = cur.format(value);		
		res = res.replace(/[^0123456789.-]/g,'');
		return res;
	}
	
	var currencies = null;
	this.i18n_getCurrencies = function (langtoken, cb) {
		if (currencies!=null) return cb(null, currencies);
		var res = [];
		var cu = i18n.currency().getCurrencies();
		_(cu).forEach(function(cid) {
			var cur = i18n.currency(cid);
			var sa = cur.format(0);
			sa= sa.replace(/[0123456789. ]/g,'');
			res.push({iso:cid,name:cur.getName(),symbol:sa,country:cur.getCountry()});
		});
		currencies = res;
		cb(null, res);
	}
	
	this.runBatch = function (tasks,cb) {
		batch = new ApiBatch(this);
		batch.run(tasks,cb);
	};
	
	var config=null;
	this.getConfig = function(cb) {
		if (config) return cb(null, config);
		fs.readFile(__dirname + "/../../../config.json", safe.trap_sure(cb, function (defconfig) {
			config = JSON.parse(defconfig);
			(function (cb) {
				if (config_)
					cb(null,config_)
				else
					fs.readFile(__dirname + "/../../../local-config.json", safe.trap(cb, function (err, localconfig) {
						if (!err)
							cb(null,JSON.parse(localconfig))
						else
							cb(null,{})
					}))
			})(function (err,lcfg) {
				config=deepExtend(config,lcfg);
				cb(null,config);
			})
		}))
	}	
}

util.inherits(Skilap, events.EventEmitter);

module.exports.createApp = function (cfg) {
	return new Skilap(cfg);
};
