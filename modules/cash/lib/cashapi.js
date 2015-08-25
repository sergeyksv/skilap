/**
 * Core API
 */
var _ = require('underscore');
var async = require('async');
var events = require("events");
var safe = require('safe');

function CashApi (ctx) {
	this._ctx = ctx;
	this._cash_accounts = null;
	this._cash_transactions = null;
	this._cash_prices = null;
	this._cash_settings = null;
	this._coreapi;
}

CashApi.prototype.getAccount = require('./accapi.js').getAccount;
CashApi.prototype.getAllAccounts = require('./accapi.js').getAllAccounts;
CashApi.prototype.getChildAccounts = require('./accapi.js').getChildAccounts;
CashApi.prototype._getAllChildsId = require('./accapi.js')._getAllChildsId;
CashApi.prototype.getAccountByPath = require('./accapi.js').getAccountByPath;
CashApi.prototype.getAccountInfo = require('./accapi.js').getAccountInfo;
CashApi.prototype.deleteAccount = require('./accapi.js').deleteAccount;
CashApi.prototype.importAccounts = require('./accapi.js').importAccounts;
CashApi.prototype.clearAccounts = require('./accapi.js').clearAccounts;
CashApi.prototype.newRegistry = require('./accapi.js').restoreToDefaults;
CashApi.prototype.getAssetsTypes = require('./accapi.js').getAssetsTypes;
CashApi.prototype.getDefaultAccounts = require('./accapi.js').getDefaultAccounts;
CashApi.prototype.saveAccount = require('./accapi.js').saveAccount;
CashApi.prototype.getSpecialAccount = require('./accapi.js').getSpecialAccount;
CashApi.prototype.getAllCurrencies = require('./accapi.js').getAllCurrencies;
CashApi.prototype.ensureAccount = require('./accapi.js').ensureAccount;
CashApi.prototype.ensureParent = require('./accapi.js').ensureParent;
CashApi.prototype.createAccountsTree = require('./accapi.js').createAccountsTree;
CashApi.prototype.getAccountTree = require('./accapi.js').getAccountTree;
CashApi.prototype.getChildAccountsHelper = require('./accapi.js').getChildAccountsHelper;
CashApi.prototype.importPrices = require('./priceapi.js').importPrices;
CashApi.prototype.clearPrices = require('./priceapi.js').clearPrices;
CashApi.prototype.getCmdtyPrice = require('./priceapi.js').getCmdtyPrice;
CashApi.prototype.getCmdtyLastPrices = require('./priceapi.js').getCmdtyLastPrices;
CashApi.prototype.getPricesByPair = require('./priceapi.js').getPricesByPair;
CashApi.prototype.savePrice = require('./priceapi.js').savePrice;
CashApi.prototype.parseGnuCashXml = require('./gnucash.js');
CashApi.prototype.getAccountRegister = require('./trnapi.js').getAccountRegister;
CashApi.prototype.getTransaction = require('./trnapi.js').getTransaction;
CashApi.prototype.updateTransactionExcangeRate = require('./trnapi.js').updateTransactionExcangeRate;
CashApi.prototype.saveTransaction = require('./trnapi.js').saveTransaction;
CashApi.prototype.importTransactions = require('./trnapi.js').importTransactions;
CashApi.prototype.clearTransactions = require('./trnapi.js').clearTransactions;
CashApi.prototype.getTransactionsInDateRange = require('./trnapi.js').getTransactionsInDateRange;
CashApi.prototype.parseRaw = require('./export.js').import;
CashApi.prototype.exportRaw = require('./export.js').export;
CashApi.prototype.getSettings = require('./settings.js').getSettings;
CashApi.prototype.saveSettings = require('./settings.js').saveSettings;
CashApi.prototype.clearSettings = require('./settings.js').clearSettings;
CashApi.prototype.importSettings = require('./settings.js').importSettings;
CashApi.prototype.initScheduler = require('./scheduler.js').initScheduler;
CashApi.prototype.startExchangeRate = require('./scheduler.js').startExchangeRate;
CashApi.prototype.stopExchangeRate = require('./scheduler.js').stopExchangeRate;
CashApi.prototype.exchangeRate = require('./scheduler.js').exchangeRate;

CashApi.prototype._loadData = function (cb) {
	var self = this;
	var adb = null;
	async.series([
		function openDb(cb) {
			self._ctx.getDB(function (err, _adb) {
				if (err) return cb(err);
				adb = _adb;
				cb();
			});
		},
		function openCollections(cb) {
			async.parallel({
				cash_accounts:function (cb) {
					adb.collection('cash_accounts',cb);
				},
				cash_transactions:function (cb) {
					adb.collection('cash_transactions',cb);
				},
				cash_prices:function (cb) {
					adb.collection('cash_prices',cb);
				},
				cash_settings:function (cb) {
					adb.collection('cash_settings',cb);
				},
				cash_accounts_stat: function (cb) {
					adb.collection('cash_accounts_stat', cb);
				},
				cash_register: function (cb) {
					adb.collection('cash_register', cb);
				},
				cash_prices_stat: function (cb) {
					adb.collection('cash_prices_stat', cb);
				}
			}, safe.sure_result(cb, function (results) {
				self._cash_accounts = results.cash_accounts;
				self._cash_transactions = results.cash_transactions;
				self._cash_prices = results.cash_prices;
				self._cash_settings = results.cash_settings;
				self._cash_accounts_stat = results.cash_accounts_stat;
				self._cash_register = results.cash_register;
				self._cash_prices_stat = results.cash_prices_stat;
			}));
		},
		function ensureIndexes(cb) {
			async.parallel([
				function (cb) {
					self._cash_accounts.ensureIndex("parentId",cb);
				},
				function (cb) {
					self._cash_accounts_stat.ensureIndex("path",cb);
				},
				function (cb) {
					self._cash_transactions.ensureIndex("datePosted",cb);
				},
				function (cb) {
					self._cash_transactions.ensureIndex("splits.accountId",{_tiarr:true},cb);
				},
				function (cb) {
					self._cash_prices.ensureIndex("date",cb);
				},
				function (cb) {
					self._cash_prices.ensureIndex("currency.id",cb);
				},
				function (cb) {
					self._cash_prices.ensureIndex("cmdty.id",cb);
				},
				function (cb) {
					self._cash_prices_stat.ensureIndex("key",cb);
				},
				function (cb) {
					self._cash_register.ensureIndex({"trId": 1 }, cb);
				},
				function (cb) {
					self._cash_register.ensureIndex({"accId": 1 }, cb);
				},
				function (cb) {
					self._cash_register.ensureIndex({ "date": 1 }, cb);
				},
				function (cb) {
					self._cash_register.ensureIndex({ "order": 1 }, cb);
				}

			], cb)
		}
	],cb);
};

CashApi.prototype.init = function (cb) {
	var self = this;
	async.series([
		function (cb) {
			self._ctx.getModule("core",function (err, module) {
				if (err) return cb(err);
				self._coreapi = module.api;
				cb();
			});
		},
		function (cb) {
			self._loadData(cb);
		},
		function (cb) {
			self.initScheduler(cb);
		},
		function (cb) {
			self._calcStats(cb);
		}
		], 
	cb);
};

var assetInfo = {
	"BANK":{act:1},
	"CASH":{act:1},
	"ASSET":{act:1},
	"CREDIT":{act:1},
	"LIABILITY":{act:-1},
	"STOCK":{act:1},
	"MUTUAL":{act:1},
	"CURENCY":{act:1},
	"INCOME":{act:-1},
	"EXPENSE":{act:1},
	"EQUITY":{act:1},
	"RECIEVABLE":{act:-1},
	"PAYABLE":{act:1},
	"INCOME/EXPENSE":{act:1}
};

CashApi.prototype.getAssetInfo = function (token, asset, cb) {
	var info = assetInfo[asset];
	if (info==null)
		return cb(new Error("Invalid asset type"));
	cb(null,info);
};

CashApi.prototype._calcStats = function _calcStats(cb) {
	var self = this;
	var _stats = {};	
	// helper functions
	function getAccStats (accId) {
		if (_stats[accId]==null)
			_stats[accId] = {_id:accId, value:0, count:0, type: "BANK"};
		return _stats[accId];
	}
	function getAccPath (acc, cb) {
		if (acc._id != acc.parentId && acc.parentId) {
			self._cash_accounts.findOne({'_id': acc.parentId}, function(err, parentAcc) {
				if (parentAcc==null) {
					cb("");
				} else {
					getAccPath(parentAcc, function (path) {
						cb(path + "::"+acc.name);
					});
				}
			});
		}
		else {
			cb(acc.name);
		}
	}

	console.time("Stats");
	var skip_calc = false;
	var defCurrency = {space:"ISO4217", id:"USD"};
	var accToDelete = {};
	var regToDelete = {};

	async.auto({
		def_currency: [function (cb) {
			// get global default currency because some stuff depend on it
			// store it if it absent
			self._cash_settings.findOne({'id': "currency"}, safe.sure(cb, function (v) {
				if (v && v.v) {
					defCurrency = v.v;
					cb()
				}
				else {
					self._cash_settings.update({'id':"currency"},{$set:{v:defCurrency}},{upsert:true}, cb)
				}
			}))
		}],
		db_stats: function (cb) {
			if (self._db_stats) return cb();
			self._db_stats = true;
			self._cash_accounts_stat.count(safe.sure(cb, function (c) {
				skip_calc = c!=0;
				cb();
			}));
		},
		load_old_acc: ['db_stats', function (cb) {
			if (skip_calc) return cb();
			self._cash_accounts_stat.find({}, {fields: {_id:1}}).toArray(safe.sure_result(cb, function(accs) {
				_.each(accs, function (acc) {
					accToDelete[acc._id] = acc._id;
				});
			}));
		}],
		load_old_reg: ['db_stats', function (cb) {
			if (skip_calc) return cb();
			self._cash_register.find({}, {fields: {_id:1}}).toArray(safe.sure_result(cb, function(regs) {
				_.each(regs, function (reg) {
					regToDelete[reg._id] = reg._id;
				});
			}));
		}],
		price_tree: ['load_old_acc', 'load_old_reg', function (cb) {
			if (skip_calc) return cb();
			console.time('price_tree');
			var priceTree = {};
			var keys = [];
			self._cash_prices.find({}, safe.sure(cb, function (cursor) {
				var stop = false;
				async.doUntil(function (cb) {
					cursor.nextObject(safe.sure(cb, function (price) {
						if (!price) {
							console.timeEnd('price_tree');
							stop = true;
							return cb();
						}
						var date = new Date(price.date);
						var key = price.cmdty.space+price.cmdty.id+price.currency.space+price.currency.id;
						keys[key] = key;
						var dir = {rate:price.value,key:key};
						var dirTree = priceTree[dir.key];
						if (!dirTree) priceTree[dir.key] = dirTree = { key: dir.key };
						if (dirTree.average==null) {
							dirTree.average=dir.rate;
							dirTree.max=dir.rate;
							dirTree.min=dir.rate;
							dirTree.last = dir.rate;
							dirTree.lastDate = date;
							dirTree.quotes=1;
						}
						else {
							dirTree.average=dirTree.average*dirTree.quotes+dir.rate;
							dirTree.quotes++;
							dirTree.average/=dirTree.quotes;
						}
						if (dir.rate>dirTree.max)
							dirTree.max = dir.rate;
						if (dir.rate<dirTree.min)
							dirTree.min = dir.rate;
						if (date>dirTree.lastDate) {
							dirTree.lastDate = date;
							dirTree.last = dir.rate;
						}
						dirTree.key = dir.key;
						delete dirTree._id;
						self._cash_prices_stat.update({ key: dir.key }, dirTree, { upsert: true, w: 1 }, cb);
					}));
				}, function () { return stop; }, function() { 
					if (!_.isEmpty(keys))
						self._cash_prices_stat.remove({ key: {$nin: _.values(key) }}, cb);
					else
						cb();
				});
			}));
		}],
		account_paths: ['db_stats', 'price_tree', function (cb) {
			if (skip_calc) return cb();
			console.time('account_paths');
			self._cash_accounts.find({}).toArray(safe.sure(cb, function (accounts) {
				async.forEach(accounts, function (acc, cb) {
					getAccPath(acc, function (path) {
						var accStats = getAccStats(acc._id);
						accStats.path = path;
						accStats.type = acc.type;
						accStats.cmdty = acc.cmdty;
						accStats.parentId = acc.parentId;
						accStats.level = path.split("::").length;
						cb();
					})
				},function (err) { console.timeEnd('account_paths'); cb(err);});
			}));
		}],
		transaction_stats: ['db_stats', 'account_paths', function (cb) {
			if (skip_calc) return cb();
			console.time("Transactions");
			var ballances = [];
			self._cash_transactions.find({}, {sort: {datePosted: 1}}, safe.sure(cb, function (cursor) {
				var stop = false;
				async.doUntil(function (cb) {
					cursor.nextObject(safe.sure(cb, function (tr) {
						if (!tr) {
							stop = true;
							return cb();
						}
						var added = {};
						async.forEachSeries(tr.splits, function (split, cb) {
							var accId = split.accountId;
							var accStats = getAccStats(accId);
							var act = assetInfo[accStats.type].act;
							accStats.value += split.quantity*act;
							if (!added[accId]) {
								added[accId] = accId;
								accStats.count++;
							}
							var doc = {date:tr.datePosted, ballance: 0};
							if (!ballances[accId])
								ballances[accId] = 0;
							ballances[accId] += split.quantity*act;
							doc.ballance = ballances[accId];
							doc.trId = tr._id;
							doc.accId = accId;
							doc.order = accStats.count;
							self._cash_register.findAndModify({ trId: tr._id, accId: accId }, [['trId', 1], ['accId', 1]], doc,
									{ upsert: true, w: 1, hint:  { trId: 1 }}, safe.sure_result(cb, function(doc) {
										if (doc._id)
											delete regToDelete[doc._id];
									}));
						}, cb);
					}));
				}, function () { return stop; }, safe.sure(cb, function () {
					console.timeEnd("Transactions");
					cb();
				}));
			}));
		}],
		account_save: ['transaction_stats', function (cb) {
			if (skip_calc) return cb();
			async.forEachSeries(_.values(_stats), function (accStats, cb) {
				var doc = _.omit(accStats, 'cmdty');
				delete accToDelete[doc._id];
				self._cash_accounts_stat.findAndModify({ _id: doc._id }, [], doc,
						{ upsert: true, w: 1 }, cb);
			}, cb);
		}],
		remove_old_acc: ['account_save', function (cb) {
			if (skip_calc) return cb();
			if (accToDelete)
				self._cash_accounts_stat.remove({'_id': {$in: _.values(accToDelete)}}, {w: 1}, cb);
			else cb();
		}],
		remove_old_reg: ['account_save', function (cb) {
			console.time("remove_old_reg");		
			if (skip_calc) return cb();
			if (regToDelete) {
				self._cash_register.remove({'_id': {$in: _.values(regToDelete)}}, {w: 1}, cb);
			}
			else cb();
		}]
		}, function done (err) {
			if (err) console.log(err);
			console.timeEnd("remove_old_reg");			
			console.timeEnd("Stats");			
			cb();
		}
	);
};

CashApi.prototype._calcPath = function (accIds, cb) {
	var self = this;
	var _stats = {};	
	// helper functions
	function getAccStats (accId) {
		if (_stats[accId]==null)
			_stats[accId] = {_id:accId, value:0, count:0, type: "BANK"};
		return _stats[accId];
	}

	function getAccPath (acc, cb) {
		if (acc._id != acc.parentId && acc.parentId) {
			self._cash_accounts.findOne({'_id': acc.parentId}, function(err, parentAcc) {
				if (parentAcc==null) {
					cb("");
				} else {
					getAccPath(parentAcc, function (path) {
						cb(path + "::"+acc.name);
					});
				}
			});
		}
		else {
			cb(acc.name);
		}
	}

	console.time("Stats Path");

	async.auto({
		load_stats: [function (cb) {
			self._cash_accounts_stat.find({'_id': {$in: accIds}}, safe.trap_sure(cb, function (cursor) {
				cursor.each(safe.trap_sure(cb, function (stat) {
					if (stat == null)
						return cb();
					_stats[stat._id] = stat;
				}));
			}));
		}],
		account_paths: ['load_stats', function (cb) {
			self._cash_accounts.find({'_id': {$in: accIds}}).toArray(safe.sure(cb, function (accounts) {
				async.forEach(accounts, function (acc, cb) {
					getAccPath(acc, function (path) {
						var accStats = getAccStats(acc._id);
						accStats.path = path;
						accStats.type = acc.type;
						accStats.parentId = acc.parentId;
						accStats.level = path.split("::").length;
						cb();
					});
				}, cb);
			}));
		}],
		account_save: ['account_paths', function (cb) {
			async.forEachSeries(_.values(_stats), function (doc, cb) {
				self._cash_accounts_stat.findAndModify({ _id: doc._id }, [], doc,
						{ upsert: true, w: 1 }, cb);
			}, cb);
		}]
		}, function done (err) {
			if (err) console.log(err);
			console.timeEnd("Stats Path");			
			cb();
		}
	);
};

CashApi.prototype._calcStatsPartial = function (accIds, minDate, cb) {
	var self = this;
	var _stats = {};	
	// helper functions
	function getAccStats (accId) {
		if (_stats[accId]==null)
			_stats[accId] = {_id:accId, value:0, count:0, type: "BANK"};
		return _stats[accId];
	}

	console.time("Stats Partial");
	var ballances = {};
	var counters = {};
	var toDelete = {};
	var accToDelete = {};

	async.auto({
		load_accs: [function (cb) {
			self._cash_accounts.find({'_id': {$in: accIds}}, {fields: {_id: 1}}).toArray(safe.trap_sure_result(cb, function (accs) {
				var realAccs = {};
				_.each(accs, function(acc) { realAccs[acc._id] = acc._id; });
				accToDelete = _.filter(accIds, function(accId) { return !realAccs[accId]; });
				accIds = _.filter(accIds, function(accId) { return realAccs[accId]; });
			}));
		}],
		load_stats: ['load_accs', function (cb) {
			self._cash_accounts_stat.find({'_id': {$in: accIds}}, safe.trap_sure(cb, function (cursor) {
				cursor.each(safe.trap_sure(cb, function (stat) {
					if (stat == null)
						return cb();
					_stats[stat._id] = stat;
					_stats[stat._id].value = 0;
				}));
			}));
		}],
		find_last: ['load_accs', function (cb) {
			if (minDate) {
				async.forEachSeries(accIds, function (accId, cb) {
					self._cash_register.findOne({'accId': accId, 'date': {$lt: minDate}}, {sort: {order: -1}}, safe.sure_result(cb, function(tr) {
						if (tr == null) return;
						ballances[accId] = tr.ballance;
						counters[accId] = tr.order;
						toDelete[accId] = {};
					}));
				}, cb);
			} else
				cb();
		}],
		find_old: ['find_last', function (cb) {
			async.forEachSeries(accIds, function (accId, cb) {
				var q = {'accId': accId};
				if (minDate)
					q.date = {$gte: minDate};
				self._cash_register.find(q).toArray(safe.sure_result(cb, function(regs) {
					_.each(regs, function(reg) {
						if (!toDelete[accId])
							toDelete[accId] = {};
						toDelete[accId][reg._id] = reg;
					});
				}));
			}, cb);
		}],
		transaction_stats: ['load_stats', 'find_old', function (cb) {
			console.time("Transactions");
			var count = 0;
			var q = {'splits.accountId': {$in: accIds}};
			if (minDate)
				q.datePosted = {$gte: minDate};
			self._cash_transactions.find(q).toArray(safe.sure(cb, function(trs) {
				console.time("Sort");
				trs.sort(function(a, b) {
					if (a.datePosted.getTime() != b.datePosted.getTime()) 
						return a.datePosted.getTime() - b.datePosted.getTime();
					if (a._id.toString() == b._id.toString())
						return 0;
					if (a._id.toString() > b._id.toString())
						return 1;
					return -1;
				});
				console.timeEnd("Sort");
				async.forEachSeries(trs, function (tr, cb) {
					count++;
					async.forEachSeries(tr.splits, function (split, cb) {
						if (_.indexOf(_.map(accIds, function(id) { return id.toString(); }), split.accountId.toString()) == -1)
							return cb();
						var accId = split.accountId;
						var accStats = getAccStats(accId);
						var act = assetInfo[accStats.type].act;
						if (!ballances[accId])
							ballances[accId] = 0;
						if (!counters[accId])
							counters[accId] = 0;
						ballances[accId] += split.quantity*act;
						accStats.value=ballances[accId];
						counters[accId]++;
						var doc = { date: tr.datePosted, trId: tr._id, accId: accId, ballance: ballances[accId], order: counters[accId]};
						self._cash_register.findAndModify({trId: tr._id, accId: accId}, [], {$set:doc},	{ upsert: true, w: 1 , hint:{trId:1}}, safe.sure_result(cb, function(obj) {
							if (!obj || _.isEmpty(obj)) {
								accStats.count++;
								return;
							}
							if (toDelete[accId] && toDelete[accId][obj._id])
								delete toDelete[accId][obj._id];
							else
								accStats.count++;
						}));
					}, cb);
				}, safe.sure(cb, function () {
					console.log('Partial transactions count:' + count);
					console.timeEnd("Transactions");
					return cb();
				}));
			}));
		}],
		remove_old: ['transaction_stats', function (cb) {
			async.forEachSeries(accIds, function (accId, cb) {
				if (!toDelete[accId] || _.isEmpty(toDelete[accId])) return cb();
				var accStats = getAccStats(accId);
				accStats.count -= _.size(toDelete[accId]);
				self._cash_register.remove({_id: {$in: _.keys(toDelete[accId])}}, {w: 1}, cb);
			}, cb);
		}],
		account_save: ['remove_old', function (cb) {
			async.forEachSeries(_.values(_stats), function (accStats, cb) {
				if (_.indexOf(_.map(accIds, function(id) { return id.toString(); }), accStats._id.toString()) == -1)
					return cb();
				self._cash_accounts_stat.update({ _id: accStats._id }, accStats,
						{ upsert: true, w: 1 }, cb);
			}, cb);
		}],
		account_remove: ['account_save', function (cb) {
			self._cash_accounts_stat.remove({'_id': {$in: accToDelete}}, {w:1}, cb);
		}],
		account_remove_regs: ['account_save', function (cb) {
			self._cash_register.find({'accId': {$in: accToDelete}}, {w:1}).toArray(safe.sure(cb, function(regs) {
				var trs = _.pluck(regs, 'trId');
				self._cash_accounts_stat.remove({'_id': {$in: trs}}, {w:1}, cb);
			}));
		}]
		}, function done (err) {
			if (err) console.log(err);
			console.timeEnd("Stats Partial");			
			cb();
		}
	);
};

CashApi.prototype._calcPriceStatsAdd = function (prices, cb) {
	var self = this;
	var priceMap = [];
	_.each(prices, function(price) {
		var key = price.cmdty.space+price.cmdty.id+price.currency.space+price.currency.id;
		priceMap[key] = price;
	});
	self._cash_prices_stat.find({'key': {$in: _.keys(priceMap)}}).toArray(safe.sure(cb, function (stats) {
		_.each(stats, function(stat) {
			priceMap[stat.key].stat = stat; 
		});
		_.each(_.keys(priceMap), function(key) {
			if (priceMap[key].stat) {
				//modify
				if (priceMap[key].stat.min > priceMap[key].value)
					priceMap[key].stat.min = priceMap[key].value;
				else if (priceMap[key].stat.max < priceMap[key].value)
					priceMap[key].stat.max = priceMap[key].value;
				if (priceMap[key].stat.lastDate < priceMap[key].date) {
					priceMap[key].stat.lastDate = priceMap[key].date;
					priceMap[key].stat.last = priceMap[key].value;
				}
				priceMap[key].stat.average = (priceMap[key].stat.average*priceMap[key].stat.quotes + priceMap[key].value)/(priceMap[key].stat.quotes + 1);
				priceMap[key].stat.quotes++;

			} else {
				//add new
				priceMap[key].stat = {
					key: key,
					average: priceMap[key].value,
					min: priceMap[key].value,
					max: priceMap[key].value,
					last: priceMap[key].value,
					lastDate: priceMap[key].date,
					quotes: 1
				};
			}
		});
		async.forEachSeries(_.values(priceMap), function(price, cb) {
			self._cash_prices_stat.findAndModify({ key: price.stat.key }, [], price.stat, { upsert: true, w: 1 }, cb);
		}, cb);
	}));
};

CashApi.prototype._calcPriceStatsPartial = function (cmdty, currency, cb) {
	var self = this;
	var priceTree = {};
	var bFound = false;
	if (cmdty == null || currency == null) {
		self._cash_prices_stat.remove(cb);
		return;
	}
	var key = cmdty.space+cmdty.id+currency.space+currency.id;
	self._cash_prices.find({cmdty: cmdty, currency: currency}, safe.sure(cb, function (cursor) {
		var stop = false;
		async.doUntil(function (cb) {
			cursor.nextObject(safe.sure(cb, function (price) {
				if (!price) {
					stop = true;
					return cb();
				}
				bFound = true;
				var date = new Date(price.date);
				var dir = {rate:price.value,key:(price.cmdty.space+price.cmdty.id+price.currency.space+price.currency.id)};
				var dirTree = priceTree[dir.key];
				if (!dirTree) priceTree[dir.key] = dirTree = { key: dir.key };
				if (dirTree.average==null) {
					dirTree.average=dir.rate;
					dirTree.max=dir.rate;
					dirTree.min=dir.rate;
					dirTree.last = dir.rate;
					dirTree.lastDate = date;
					dirTree.quotes=1;
				}
				else {
					dirTree.average=dirTree.average*dirTree.quotes+dir.rate;
					dirTree.quotes++;
					dirTree.average/=dirTree.quotes;
				}
				if (dir.rate>dirTree.max)
					dirTree.max = dir.rate;
				if (dir.rate<dirTree.min)
					dirTree.min = dir.rate;
				if (date>dirTree.lastDate) {
					dirTree.lastDate = date;
					dirTree.last = dir.rate;
				}
				dirTree.key = dir.key;
				delete dirTree._id;
				self._cash_prices_stat.update({ key: dir.key }, dirTree, { upsert: true, w: 1 }, cb);
			}));
		}, function () { return stop; }, function() {
			if (!bFound)
				self._cash_prices_stat.remove({key: {$in:key}}, cb);
			else 
				cb();
		});
	}));
};

module.exports.init = function (ctx,cb) {
	var api = new CashApi(ctx);
	api.init(function (err) {
		if (err) return cb(err);
		cb(null, api);
	});
};
