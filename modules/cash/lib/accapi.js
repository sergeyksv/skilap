var async = require('async');
var safe = require('safe');
var _ = require('underscore');
var SkilapError = require("skilap-utils").SkilapError;

module.exports.getAccount = function (token, id, cb) {
	var self = this;
	self._coreapi.checkPerm(token,["cash.view"],safe.trap_sure(cb, function () {
		self._cash_accounts.findOne({'_id': new self._ctx.ObjectID(id.toString())}, cb);
	}))
};

module.exports.getAllAccounts = function (token, cb) {
	var self = this;
	async.series ([
		function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
		function get(cb) {
			self._cash_accounts.find({}).toArray(cb);
		}], safe.sure_result(cb, function (results) {
			return results[1];
		})
	);
};

module.exports.getChildAccounts = function(token, parentId, cb) {
	var self = this;
	async.series ([
		function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
		function get(cb) {
			self._cash_accounts.find({'parentId': new self._ctx.ObjectID(parentId.toString())}).toArray(cb);
		}
		], safe.sure_result(cb,function (results) {
			return results[1];
		})
	);
};

module.exports.getAccountByPath = function (token,path,cb) {
	var self = this;
	async.series ([
		function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
		function find(cb) {
			self._cash_accounts_stat.findOne({'path': path}, function(err, stat) {
				if (stat==null)
					return cb(new SkilapError("No such account","NO_SUCH_ACCOUNT"));
				self.getAccount(token,stat._id,cb);
			});
		}
		], safe.sure_result(cb,function (results) {
			return results[1];
		})
	);
};

module.exports.getSpecialAccount = function (token,type,cmdty,cb) {
	var self = this;
	var name = "";
	if (type == "disballance")
		name = self._ctx.i18n(token, 'cash', 'Disballance') + "_" + cmdty.id;
	else
		return cb(new Error("Unsupported type"));

	self.getAccountByPath(token,name, function (err, acc) {
		if (err) {
			if (err && err.data && err.data.subject == "NO_SUCH_ACCOUNT") {
				// create one
				var newacc = {"parentId":0,"cmdty":cmdty,"name":name,"type":"EQUITY"};
				return self.saveAccount(token, newacc, cb);
			} else
				return cb(err); // unknown error
		}
		if (!_(acc.cmdty).isEqual(cmdty))
			return cb(new Error("Special account exist, but has wrong currency"));
		if (acc.type!="EQUITY")
			return cb(new Error("Special account exist, but has wrong type"));
		cb(null, acc);
	});
};

module.exports.getAccountInfo = function (token, accId, details, cb) {
	var self = this;
	var accInfo = null;
	var accStats = null;
	var assInfo = null;
	async.series ([
		function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
		function (cb) {
			self._cash_accounts_stat.findOne({'_id': new self._ctx.ObjectID(accId.toString())}, function(err, stat) {
				accStats = stat;
				if (accStats==null)
					return cb(new Error("Invalid account Id: "+accId));
				cb();
			});
		},
		function (cb) {
			if (!_(details).include("verbs"))
				return cb();
			self.getAssetsTypes(token, safe.sure(cb,function (assets) {
				accInfo = _(assets).find(function (e) { return e.value == accStats.type; } );
				if (accInfo==null)
					return cb(new Error("Wrong account type"));
				cb();
			}));
		},
		function (cb) {
			if (!_(details).include("act"))
				return cb();
			self.getAssetInfo(token, accStats.type, safe.sure_result(cb,function (info) {
				assInfo = info;
			}));
		},
		safe.trap(function (cb) {
			var res = {};
			res._id = accId;
			_.forEach(details, function (val) {
				switch(val) {
					case 'value':
						res.value = accStats.value;
						break;
					case 'count':
						res.count = accStats.count;
						break;
					case 'path':
						res.path = accStats.path;
						break;
					case 'verbs':
						res.verbs = {};
						res.verbs.recv = accInfo.recv;
						res.verbs.send = accInfo.send;
						break;
					case 'act':
						res.act = assInfo.act;
						break;
					case 'level':
						res.level = accStats.level;
					break;
				}
			});
			cb(null, res);
		})], safe.sure_result(cb, function (results) {
			return results[4];
		})
	);
};

module.exports.deleteAccount = function (token, accId, options, cb){
	var self = this;
	var accForRecalc = {};
	accForRecalc[accId] = accId;
	async.series([
		function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
		function processTransactions(cb) {
			var updates = [];
			self._cash_transactions.find({'splits.accountId': new self._ctx.ObjectID(accId.toString())}, safe.trap_sure(cb, function (cursor) {
				var stop = false;
				async.doUntil(function (cb) {
					cursor.nextObject(safe.sure(cb, function (tr) {
						if (!tr) {
							stop = true;
							return cb();
						}
						// collecte transactions that need to be altered
						async.forEachSeries(tr.splits, function (split, cb) {
							if (split.accountId.toString() == accId) {
								if (options.newParent) {
									split.accountId = new self._ctx.ObjectID(options.newParent);
									accForRecalc[options.newParent] = options.newParent;
									self._cash_transactions.update({_id: tr._id}, tr, {w: 1}, cb);
								} else {
									updates.push(tr._id);
									cb();
								}
							} else {
								if (!options.newParent)
									accForRecalc[split.accountId.toString()] = split.accountId.toString();
								cb();
							}
						}, cb);
					}));
				}, function () { return stop; }, function() {
					// scan done, propagate changes
					self._cash_transactions.remove({'_id': { $in: updates }}, cb);
				});
			}));
		},
		function processSubAccounts(cb1){
			if (options.newSubParent) {
				accForRecalc[options.newSubParent] = options.newSubParent;
				self.getChildAccounts(token, accId, safe.trap_sure(cb1,function(childs){
					async.forEach(childs, function(ch,cb2) {
						accForRecalc[ch._id.toString()] = ch._id.toString();
						ch.parentId = new self._ctx.ObjectID(options.newSubParent);
						self._cash_accounts.update({_id: ch._id}, ch, {w: 1}, cb2);
					},cb1);
				}));
			} else {
				var childs = [];
				async.series([
					function(cb) {
						self._getAllChildsId(token, accId, childs, cb);
					},
					function (cb) {
						childsSt = _.map(childs, function(c) { return c.toString(); });
						_.each(childsSt, function (ch) {accForRecalc[ch] = ch; });
						var updates = [];
						self._cash_transactions.find({'splits.accountId': {$in: childs}}, safe.trap_sure(cb, function (cursor) {
							var stop = false;
							async.doUntil(function (cb) {
								cursor.nextObject(safe.sure(cb, function (tr) {
									if (!tr) {
										stop = true;
										return cb();
									}
									var bUpdate = false;
									// collecte transactions that need to be altered
									_(tr.splits).forEach(function (split) {
										accForRecalc[split.accountId.toString()] = split.accountId.toString();
										if (_(childsSt).indexOf(split.accountId.toString()) > -1){
											if (options.newSubAccTrnParent) {
												bUpdate = true;
												accForRecalc[options.newSubAccTrnParent] = options.newSubAccTrnParent;
												split.accountId = new self._ctx.ObjectID(options.newSubAccTrnParent);
											} else
												updates.push(tr._id);
										}
									});
									if (bUpdate) {
										self._cash_transactions.update({_id: tr._id}, tr, {w: 1}, cb);
									} else {
										cb();
									}
								}));
							}, function () { return stop; }, function() {
								// scan done, propagate changes
								self._cash_transactions.remove({'_id': { $in: updates }}, cb);
							});
						}));
					},
					function (cb) {
						self._cash_accounts.remove({'_id': { $in: childs}}, cb);
					}
				],cb1);
			}
		},
		function deleteAcc(cb1) {
			self._cash_accounts.remove({'_id': new self._ctx.ObjectID(accId)}, cb1);
		}
	], safe.sure(cb, function () {
		self._calcStatsPartial(_.map(_.keys(accForRecalc), function(id) { return new self._ctx.ObjectID(id); }), null, cb);
	}));
};

module.exports._getAllChildsId = function (token, parentId, buffer, cb) {
	var self = this;
	async.waterfall([
		function (cb) { self.getChildAccounts(token, parentId,cb); },
		function(childs, cb){
			async.forEach(childs, function (ch, cb) {
				buffer.push(ch._id);
				self._getAllChildsId(token, ch._id, buffer, cb);
			}, cb);
		}
	],cb);
};

module.exports.clearAccounts = function (token, ids, cb) {
	var self = this;
	async.series ([
		function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
		function (cb) {	
			if (ids == null)
				self._cash_accounts.remove({}, {w: 1}, cb);
			else
				self._cash_accounts.remove({'_id': {$in: _.map(ids, function(id) { return new self._ctx.ObjectID(id); })}}, {w: 1}, cb);
		}
	], safe.sure(cb, function () {
		if (ids != null && !_.isEmpty(ids))
			self._calcStats(cb);
		else
			cb();
	}));
};

module.exports.importAccounts = function  (token, accounts, cb) {
	var self = this;
	async.series ([
		function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
		function (cb) {
			self._cash_accounts.insert(accounts, {w: 1}, cb);
		},
	], safe.sure_result(cb,function () {
	}));
};

module.exports.getDefaultAccounts = function (token, cmdty, cb){
	var self = this;
	var ctx = self._ctx;
	var accounts = [
		{name:ctx.i18n(token, 'cash', 'Cash'), type:'CASH', ch:[ctx.i18n(token, 'cash', 'My wallet')]},
		{name:ctx.i18n(token, 'cash', 'Bank'), type:'BANK', ch:[ctx.i18n(token, 'cash', 'My account')]},
		{name:ctx.i18n(token, 'cash', 'Credit Cards'), type:'CREDIT', ch:[ctx.i18n(token, 'cash', 'My card')]},
		{name:ctx.i18n(token, 'cash', 'Income'), type:'INCOME', ch:[ctx.i18n(token, 'cash', 'Salary'), ctx.i18n(token, 'cash', 'Interest'), ctx.i18n(token, 'cash', 'Assets sale'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Car'), type:'EXPENSE', ch:[ctx.i18n(token, 'cash', 'Fuel'), ctx.i18n(token, 'cash', 'Insurance'), ctx.i18n(token, 'cash', 'Service'), ctx.i18n(token, 'cash', 'Repair'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Life'), type:'EXPENSE', ch:[ctx.i18n(token, 'cash', 'Food'), ctx.i18n(token, 'cash', 'Drugs'), ctx.i18n(token, 'cash', 'Transport'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Utilities'), type:'EXPENSE', ch:[ctx.i18n(token, 'cash', 'Mobile links'), ctx.i18n(token, 'cash', 'Fixed links'), ctx.i18n(token, 'cash', 'House'), ctx.i18n(token, 'cash', 'Education'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Hobby'), type:'EXPENSE', ch:[ctx.i18n(token, 'cash', 'Sport'), ctx.i18n(token, 'cash', 'Garden'), ctx.i18n(token, 'cash', 'Charity'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Real assets'), type:'EXPENSE', ch:[ctx.i18n(token, 'cash', 'Transport'), ctx.i18n(token, 'cash', 'Furniture'), ctx.i18n(token, 'cash', 'Estate'), ctx.i18n(token, 'cash', 'Goods'), ctx.i18n(token, 'cash', 'Insurance'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Recreation'), type:'EXPENSE', ch:[ctx.i18n(token, 'cash', 'Travel'), ctx.i18n(token, 'cash', 'Pleasures'), ctx.i18n(token, 'cash', 'Food & drinks'), ctx.i18n(token, 'cash', 'Events'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Accidental'), type:'EXPENSE', ch:[ctx.i18n(token, 'cash', 'Stolen'), ctx.i18n(token, 'cash', 'Gifts'), ctx.i18n(token, 'cash', 'Bad debts'), ctx.i18n(token, 'cash', 'Other')]},
		{name:ctx.i18n(token, 'cash', 'Debts'), type:'EQUITY', ch:[ctx.i18n(token, 'cash', 'Friends')]}
	];

	var ret = [];
	_.each(accounts, function(acc) {
		var id = new ctx.ObjectID();
		ret.push({cmdty:cmdty, name:acc.name, _id:id, type:acc.type});
		_.each(acc.ch, function(name) {
			ret.push({parentId:id, cmdty:cmdty, name:name, _id:new ctx.ObjectID(), type:acc.type});
		});
	})
	cb(null, ret);
};

module.exports.restoreToDefaults = function (token, cmdty, type, cb){
	var self = this;
	var accounts = [];
	async.series([
		function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
		function (cb) {
			self._cash_prices.remove(cb);
		},
		function (cb) {
			self._cash_transactions.remove(cb);
		},
		function (cb){
			self._cash_accounts.remove(cb);
		},
		function (cb){
			self._cash_settings.remove(cb);
		},
		function (cb) {
			if (type == "default")
				self.getDefaultAccounts(token, cmdty, safe.sure(cb, function (accounts_) {
					accounts = accounts_; cb()
				}))
			else
				cb();
		},
		function (cb) {
			self._cash_accounts.insert(accounts, {w: 1}, cb);
		},
		function (cb) {
			self.saveSettings(token,"currency",cmdty,cb);
		}
	], safe.sure(cb, function () {
		self._calcStats(cb);
	}));
};

module.exports.getAssetsTypes = function (token,cb) {
	var self = this;
	var types = [
			{value:"BANK", name:self._ctx.i18n(token, 'cash', 'Bank'),act:1,recv:self._ctx.i18n(token, 'cash', 'Deposited'),send:self._ctx.i18n(token, 'cash', 'Withdrawal')},
			{value:"CASH", name:self._ctx.i18n(token, 'cash', 'Cash'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"ASSET", name:self._ctx.i18n(token, 'cash', 'Asset'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"CREDIT", name:self._ctx.i18n(token, 'cash', 'Credit card'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"LIABILITY", name:self._ctx.i18n(token, 'cash', 'Liability'),act:-1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"STOCK", name:self._ctx.i18n(token, 'cash', 'Stock'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"MUTUAL", name:self._ctx.i18n(token, 'cash', 'Mutual found'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"CURENCY", name:self._ctx.i18n(token, 'cash', 'Curency'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"INCOME", name:self._ctx.i18n(token, 'cash', 'Income'),act:-1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"EXPENSE", name:self._ctx.i18n(token, 'cash', 'Expense'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"EQUITY", name:self._ctx.i18n(token, 'cash', 'Equity'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"RECIEVABLE", name:self._ctx.i18n(token, 'cash', 'Recievable'),act:-1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"PAYABLE", name:self._ctx.i18n(token, 'cash', 'Payable'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
			{value:"INCOME_AND_EXPENSE", name:self._ctx.i18n(token, 'cash', 'Income and expense'),act:1,recv:self._ctx.i18n(token, 'cash', 'Received'),send:self._ctx.i18n(token, 'cash', 'Spent')},
		];
	cb (null, types);
};

module.exports.saveAccount = function (token, account, cb) {
	var self = this;
	var childs = [];
	async.series ([
		function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
		function (cb) {
			if (account._id)
				account._id = new self._ctx.ObjectID(account._id);
			else
				account._id = new self._ctx.ObjectID();
			if (account.parentId) account.parentId = new self._ctx.ObjectID(account.parentId.toString());
			self._cash_accounts.save(account, cb);
		},
		function(cb) {
			self._getAllChildsId(token, account._id, childs, cb);
		}], safe.sure(cb,function (result) {
			childs.push(account._id);
			self._calcPath(childs, function () { cb(null, account); });
		})
	);
};

module.exports.ensureParent = function (token, accountName, leadAcc, cb) {
	var self = this;
	var childs = [];
	var parentId;
	var account = {};
	self.getAccountByPath(token, accountName, function(err, res) {
		if (res) return cb(null, res);
		async.series ([
			function (cb) { 
				var index = accountName.lastIndexOf("::");
				if (index == -1) return cb();
				var path = accountName.slice(0, index);
				accountName = accountName.slice(index + 2);
				self.ensureParent(token, path, leadAcc, safe.sure_result(cb, function(acc) {
					parentId = acc._id;
					leadAcc = acc;
				}));
			},
			function (cb) {
				account.cmdty = leadAcc.cmdty;
				account.type = leadAcc.type;
				account.name = accountName;
				account._id = new self._ctx.ObjectID();
				if (parentId)
					account.parentId = parentId;
				self._cash_accounts.save(account, cb);
			}], safe.sure(cb,function (result) {
				childs.push(account._id);
				self._calcPath(childs, function () { cb(null, account); });
			})
		);
	});
};

module.exports.ensureAccount = function (token, accountName, leadAccId, cb) {
	var self = this;
	var childs = [];
	var leadAcc = {
			cmdty: { "space" : "ISO4217" , "id" : "USD"},
			type: "CASH"
	};
	var parentId;
	var account = {};
	self.getAccountByPath(token, accountName, function(err, res) {
		if (res) return cb(null, res);
		async.series ([
			function (cb) { self._coreapi.checkPerm(token,["cash.edit"],cb); },
			function (cb) { 
				self.getAccount(token, leadAccId, safe.sure_result(cb, function(res) {
					if (res) leadAcc = res;
				}));
			},
			function (cb) { 
				var index = accountName.lastIndexOf("::");
				if (index == -1) return cb();
				var path = accountName.slice(0, index);
				accountName = accountName.slice(index + 2);
				self.ensureParent(token, path, leadAcc, safe.sure_result(cb, function(acc) {
					parentId = acc._id;
					leadAcc = acc;
				}));
			},
			function (cb) {
				account.cmdty = leadAcc.cmdty;
				account.type = leadAcc.type;
				account.name = accountName;
				account._id = new self._ctx.ObjectID();
				if (parentId)
					account.parentId = parentId;
				self._cash_accounts.save(account, cb);
			}], safe.sure(cb,function (result) {
				childs.push(account._id);
				self._calcPath(childs, function () { cb(null, account); });
			})
		);
	});
};

module.exports.getAllCurrencies = function(token,cb){
	var self = this;
	async.waterfall ([
		function (cb) { self._coreapi.checkPerm(token,["cash.view"],cb); },
		function(cb){
			async.parallel({
				curr:function (cb) {
					self._ctx.i18n_getCurrencies(token, cb);
				},
				usedCurr:function (cb) {
					var usedCurrencies = {};
					self._cash_accounts.find({}, safe.trap_sure(cb, function (cursor) {
						cursor.each(safe.trap_sure(cb, function (acc) {
							if (acc)
								usedCurrencies[acc.cmdty.id] = acc.cmdty;
							else
								cb(null, usedCurrencies);
						}));
					}));
				}
			},function (err, result) {
				cb(err, result.curr,result.usedCurr);
			});
		},
		function(currencies,usedCurrencies,cb){
			_.forEach(currencies,function(curr){
				curr.used = _.has(usedCurrencies, curr.iso) ? 1 : 0;
			});
			cb(null,currencies);
		}
	], cb
	);
};

module.exports.createAccountsTree = function(accounts){
	accounts = _(accounts).sortBy(function (e) {return e.name; });
	var oAccounts = _.reduce(accounts,function(memo,item){
		memo[item._id] = _.clone(item);
		memo[item._id].childs=[];
		return memo;
	},{});

	_.forEach(_.keys(oAccounts),function(key){
		if(oAccounts[key].parentId){
			oAccounts[oAccounts[key].parentId].childs.push(oAccounts[key]);
		}
	});
	return _.filter(_.values(oAccounts),function(item){
		return (!item.parentId && !item.hidden);
	});
};

module.exports.getChildAccountsHelper = function(token, id, child, cb) {
	var self = this;
	var ret = [];
	self.getChildAccounts(token, id, safe.sure(cb, function (data) {
		ret = child.concat(data);
		async.forEachSeries(data, function(acc, cb1) {
			self.getChildAccountsHelper(token, acc._id, child, function (err, data) {
				ret = ret.concat(data);
				cb1(null, ret);
			});
		}, function (err) {
			cb(null, ret);
		});
	}));
};

function getTopParent(self, token, id, cb) {
	self.getAccount(token, id, function (err, data) {
		if (data.parentId)
			getTopParent(self, token, data.parentId, cb);
		else
			cb(null, data);
	});
}

module.exports.getAccountTree = function (token, id, settings, detail, cb) {
	var self = this;
	var accounts = [];
	async.series({
		main:function (cb) {
			getTopParent(self, token, id, safe.sure_result(cb, function (data) {
				accounts.push(data);
			}));
		},
		child:function (cb) {
			self.getChildAccountsHelper(token, accounts[0]._id, accounts, safe.sure_result(cb, function (data) {
				accounts = data;
			}));
		},
		assets:function (cb) {
			async.forEach(accounts, function(acc, cb) {
				self.getAccountInfo(token, acc._id, detail, safe.sure_result(cb, function (data) {
					_.extend(acc, data);
					acc.repCmdty = settings.cmdty;
				}));
			}, cb);
		},
		tree:function (cb) {
			cb(null, self.createAccountsTree(accounts));
		}
	}, function (err, r) {
		cb(err, r.tree);
	});
};
