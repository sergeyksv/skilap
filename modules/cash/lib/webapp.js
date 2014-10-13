var _ = require('underscore');
var async = require('async');
var safe = require('safe');
var SkilapError = require("skilap-utils").SkilapError;
var vstatic = require('pok_utils').vstatic;
var handlebarsMiddleware = require('pok_utils').handlebarsMiddleware;
var lessMiddleware = require('less-middleware');
var Handlebars = require('handlebars');
var DateFormat = require('dateformatjs').DateFormat;
var df = new DateFormat("MM/dd/yyyy");
var dfW3C = new DateFormat(DateFormat.W3C);

function CashWeb (ctx) {
	var self = this;
	this.ctx = ctx;
	this.api = null;
	this.web = null;
	this.prefix = "/cash";
	this.tabs = [];
	this._cash_userviews = null;
	this._coreapi = null;
}

CashWeb.prototype._init = function (cb) {
	var self = this;
	async.parallel([
		function (cb) {
			self.ctx.getModule("core",safe.sure_result(cb, function (module) {
				self._coreapi = module.api;
			}));
		},
		function (cb) {
			self.ctx.getDB(safe.sure(cb,function (adb) {
				async.parallel({
					_cash_userviews:function (cb) {
						adb.collection('cash_userviews',cb);
					}
				}, safe.sure_result(cb, function (results) {
					_.extend(self,results);
				}));
			}));
	}], 
	cb);
};

CashWeb.prototype.layout = function () {
	var self = this;
	return function (req,res,next) {
		self.api.getCmdtyLastPrices(req.session.apiToken, safe.sure(next, function (prices) {
			Handlebars.registerHelper('i18n_cost', function(cmdtyRep, cmdtySrc, value, options) {
				cmdtySrc = cmdtySrc || {space:"ISO4217", id:"USD"};
				var cmdtyDst = cmdtyRep||{space:"ISO4217", id:"USD"};
				var key = (cmdtySrc.space+cmdtySrc.id+cmdtyDst.space+cmdtyDst.id);
				var price = prices[key] || 1;
				return (price!=1?"( "+self.ctx.i18n_cytext(req.session.apiToken, cmdtySrc.id, value) + ")":"")
					+" "+self.ctx.i18n_cytext(req.session.apiToken, cmdtyDst.id, price*value);																									
			});	
			Handlebars.registerHelper('i18n_cmdtytext', function(cmdty,value) {
				return self.i18n_cmdtytext(req.session.apiToken,cmdty,value);
			});
			res.locals.layout = "layout";
			next();
		}));
	}
};

CashWeb.prototype.guessTab = function (req, ti,cb) {	
	var self = this;
	var vtabs=[];
	var user = null;
	async.waterfall ([
		// we need user first
		function (cb) {
			self._coreapi.getUser(req.session.apiToken, cb);
		},
		function (user_, cb) {
			if (user_.type=='guest')
				cb(new SkilapError(self.ctx.i18n(req.session.apiToken, 'core', 'Access denied'),'AccessDenied'));
			else
				cb(null, user_);
		},		
		function (user_, cb) {
			user = user_;
			if (user.type!='guest')
				self._cash_userviews.findOne({'_id': user._id}, cb);
			else
				cb(null,{});
		},
		safe.trap(function (views, cb) {
			if (views==null) views = {tabs:[], _id: user._id};			
			var tab = null;
			// search current tabs			
			_.forEach(views.tabs, function (t) {				
				var vtab = {name:t.name,url:t.url,pid:t.pid};
				if (ti.pid==t.pid) {
					tab = t;
					vtab.selected = true;
					vtab.activeTabClass = "active";
				}
				vtabs.push(vtab);
			});
			// if tab for that page not found create new
			if (!tab) {
				tab = {name:ti.name, pid:ti.pid, url:ti.url};
				vtabs.push({name:ti.name, selected:true, url:ti.url, pid:ti.pid, activeTabClass: "active"});
				views.tabs.push(tab);
				if (user.type!='guest')
					self._cash_userviews.save(views,cb);
				else
					cb();
			} else
				cb();
		})], safe.sure_result(cb, function (results) {
			return vtabs;
		})
	);
};

CashWeb.prototype.removeTabs = function (token, tabIds, cb) {
	var self = this;
	var user = null;
	// we can accept bot single or multiple ids
	if (!_.isArray(tabIds)) {
		tabIds = [tabIds];
	}	
	async.waterfall ([
		// we need user first
		function (cb) {
			self._coreapi.getUser(token, cb);
		},
		function (user_, cb) {
			user = user_;
			self._cash_userviews.findOne({'_id': user._id}, cb);
		},
		safe.trap(function (views, cb) {
			if (views==null)
				views={tabs:[]};
			if (_.isEqual(tabIds,[null]))
				views.tabs = [];
			else
				views.tabs = _.reject(views.tabs, function (t) { return _(tabIds).include(t.pid); } );
			views._id = user._id;			
			self._cash_userviews.save(views, cb);
		})], cb
	);
};

CashWeb.prototype.saveTabSettings = function(token, tabId, settings, cb) {	
	var self = this;
	var user = null;
	async.waterfall ([
		// we need user first
		function (cb) {
			self._coreapi.getUser(token, cb);
		},
		function (_user, cb) {
			user = _user;
			self._cash_userviews.findOne({'_id': user._id}, cb);
		},
		function (views, cb) {
			var t = _.find(views.tabs,function (t) {return t.pid == tabId; });
			if (!t) return cb();
			t.settings = settings;
			self._cash_userviews.save(views, cb);
		}], cb
	);
};

CashWeb.prototype.getTabSettings = function(token, tabId, cb) {
	var self = this;
	async.waterfall ([
		// we need user first
		function (cb) {
			self._coreapi.getUser(token, cb);
		},
		function (user, cb) {
			self._cash_userviews.findOne({'_id': user._id} ,cb);
		},
		function (views, cb) {
			var ret = _.find(views.tabs, function (t) {return t.pid == tabId; });
			if (ret) 
				cb(null, ret.settings);
			else
				cb(null, {});
		}], safe.sure(cb, function (ret) {
			if (ret==null) ret = {};
			cb(null, ret);
		})
	);
};

CashWeb.prototype.getUseRangedCurrencies = function(token, cb) {
	var self = this;
	var res =  {};
	async.waterfall([
		function (cb) { 
			self.api.getAllCurrencies(token,cb);
		},
		safe.trap(function(currencies,cb){
			res.all = currencies;
			res.used = _.filter(currencies,function(curr){
				return curr.used == 1;
			});
			res.unused = _.filter(currencies,function(curr){
				return curr.used == 0;
			});
			cb();
		})
	], safe.sure_result(cb, function () {
		return res;
	}));
};

CashWeb.prototype.i18n_cmdtytext = function(langtoken,cmdty,value) {
	var self = this;
	if (cmdty.space == 'ISO4217')
		return self.ctx.i18n_cytext(langtoken,cmdty.id,value);
	else {
		var res = self.ctx.i18n_cytext(langtoken,'USD',value);
		res.replace('USD',cmdty.id);
		return res;
	}
};
		
CashWeb.prototype.i18n_cmdtyval = function(cmdty,value) {
	var self = this;
	if (cmdty.space == 'ISO4217')
		return self.ctx.i18n_cyval(cmdty.id,value);
	else 
		return self.ctx.i18n_cyval('USD',value);
};

CashWeb.prototype.saveParams = function(apiToken, params, type, cb) {	
	var self = this;
	var url = self.prefix+"/reports/"+type;
	var oldpid = "reports-" +type + "-" + params.oldName;
	var pid = "reports-" +type + "-" + params.reportName;
	var settings = getDefaultSettings();
	settings.accType = params.accType;
    settings.accType2 = params.accType2;
    settings.twoline = params.twoline;
	settings.maxAcc = params.maxAcc;
	settings.startDate = dfW3C.format(new Date(params.startDate));
	settings.endDate = dfW3C.format(new Date(params.endDate));
	settings.reportName = params.reportName;
	settings.accIds = _.isArray(params.accIds) ?_.map(params.accIds, function(item){return new self.ctx.ObjectID(item)}) : null;
	settings.accLevel = params.accLevel;
	settings.reportCurrency = params.reportCurrency;
	var steeps = [
		function(cb) {
			self.removeTabs(apiToken, oldpid, cb);
		},
		function(cb) {
			var req = {session:{}};
			req.session.apiToken = apiToken;  
			self.guessTab(req, {pid:pid, name:settings.reportName, url:url+"?name="+settings.reportName}, cb);
		},
		function(cb){
			self.saveTabSettings(apiToken, pid, settings, cb);
		}
	];
	// if pid the same then not need to recreate tabs
	if (oldpid==pid)
		steeps = steeps.slice(2);

	async.series(steeps, function (err) {		
		if (err) cb(err);		
		else cb(null,url+"?name="+settings.reportName);		
	})
};

function getDefaultSettings(reportName) {
	var defaultSettings = {
			startDate:dfW3C.format(new Date(new Date().getFullYear()-2, 0, 1)),
			endDate:dfW3C.format(new Date(new Date().getFullYear()-2, 11, 31)),
			accIsVisible:1,
			accType:"EXPENSE",
            accType2:"EXPENSE",
            twoline:"off",
			maxAcc:10,
			reportName:reportName,
			accIds:null,
			accLevel:2,
			accLevelOptions:[{name:'All'},{name:1},{name:2},{name:3},{name:4},{name:5},{name:6}],
			version: 2,
			reportCurrency:"RUB"
		};
	return defaultSettings;
}

module.exports.init = function (ctx,cb) {
	var self = this;
	async.parallel ([
		function createApi(cb) {
			var api = require("./cashapi.js");
			api.init(ctx, cb);
		},
		function createWeb(cb) {
			var web = new CashWeb(ctx);
			web._init(safe.sure_result(cb, function () {
				return web;
			}));
		}], safe.sure(cb, function (results) {
			var m = {};
			m.web = results[1];
			m.api = results[0];
			m.web.api = m.api;
			
			// expose web functions thru api with "web" prefix
			var webApi = m.web.constructor.prototype;
			_.forEach(_(webApi).keys(), function (fn) {
				m.api["web_"+fn] = function () {
					m.web[fn].apply(m.web, arguments);
				};
			});

			m.localePath = __dirname+'/../locale';
			
			m.getPermissionsList = function (token, cb) {
				var res = [];
				res.push({id:'cash.view', desc:ctx.i18n(token, 'cash', 'View cash data')});
				res.push({id:'cash.add', desc:ctx.i18n(token, 'cash', 'Append new data')});
				res.push({id:'cash.edit', desc:ctx.i18n(token, 'cash', 'Edit cash data')});
				cb(null,res);
			};
			
			m.getModuleInfo = function (token, cb) {
				var i = {};
				i.name = ctx.i18n(token, 'cash', 'Cash module');
				i.desc = ctx.i18n(token, 'cash', 'Personal and familty finances. Inspired by gnucash.');
				i.url = "/cash/";
				i._id = 'cash';
				cb(null,i);
			};
			
			m.initWeb = function (webapp, cb) {
				var self = m.web;
				self.web = webapp;
				self.web.use(lessMiddleware({dest: __dirname + '/../public/css', src: __dirname + '/../res/less', prefix:'/cash/css/'}));
				self.web.use(handlebarsMiddleware({dest: __dirname + '/../public/hbs', src: __dirname + '/../res/views', prefix:'/cash/hbs/'}));
				self.web.use(vstatic(__dirname + '/../public',{vpath:"/cash"}));
				require("../pages/account.js")(self);
				require("../pages/index.js")(self);
				require("../pages/import.js")(self);
				require("../pages/report.js")(self);
				require("../pages/accounts.js")(self);
				require("../pages/restoredefaults.js")(self);
				require("../pages/export.js")(self);
				require("../pages/priceeditor.js")(self);
				cb();
			}				

			cb(null, m);
		})
	);
};
