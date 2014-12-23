var DateFormat = require('dateformatjs').DateFormat;
var df = new DateFormat("MM/dd/yyyy");
var dfW3C = new DateFormat(DateFormat.W3C);
var async = require("async");
var _ = require('underscore');
var repCmdty = {space:"ISO4217",id:"RUB"};
var safe = require('safe');

module.exports = function account(webapp) {
	var app = webapp.web;
	var cashapi = webapp.api;
	var prefix = webapp.prefix;
	var ctx = webapp.ctx;
	var reportSettingsVersion = 2;

	app.get(prefix + "/reports/barflow", webapp.layout(), function (req, res, next ) {
		report1(req, res, next, "barflow");
	});

	app.get(prefix + "/reports/pieflow", webapp.layout(), function (req, res, next ) {
		report1(req, res, next, "pieflow");
	});

	app.get(prefix + "/reports/iebar", webapp.layout(), function (req, res, next ) {
		report1(req, res, next, "iebar");
	});

	function report1(req, res, next, type) {
		if (!req.query || !req.query.name) {
			var ct
			switch(type) {
				case 'pieflow':
					ct = 'Pie flow chart';
				break;
				case 'barflow':
					ct = 'Bar flow chart';
					break;
				case 'iebar':
					ct = 'Income and Expense chart'
					break;
				default:
					ct = "Income statement";
			}

			res.redirect(req.url + "?name=" +  ctx.i18n(req.session.apiToken, 'cash', ct));
			return;
		}

		var pid = "reports-" + type + "-" + req.query.name;
		var vtabs,data,reportSettings;
		async.waterfall([
			function (cb1) {
				async.series([
					function(cb2) {
						webapp.guessTab(req, {pid: pid, name:req.query.name, url:req.url}, cb2);
					},
					function(cb2) {
						webapp.getTabSettings(req.session.apiToken, pid, cb2);
					}
				],
				function (err, results) {
					cb1(null, results[0], results[1]);
				});
			},
			function (vtabs_, reportSettings_, cb1) {
				vtabs = vtabs_;
				reportSettings = reportSettings_;
				if (_.isEmpty(reportSettings) || !reportSettings.version || (reportSettings.version != reportSettingsVersion)){
					reportSettings = getDefaultSettings(req.query.name);
					webapp.saveTabSettings(req.session.apiToken, pid, reportSettings, function(err){
						if (err) console.log(err);
					});
				}

				if(type == 'iebar') {
					async.series([
						function (cb) {
							reportSettings.accType = 'INCOME'
							calculateGraphData(req.session.apiToken,type,reportSettings,cb);
						},
						function (cb) {
							reportSettings.accType = 'EXPENSE'
							calculateGraphData(req.session.apiToken,type,reportSettings,cb);
						}
					], function (err, rez) {
						var rezdata = {
								categories:rez[0].categories,
								barflow:1
							},
								series = []

						for(var i=0;i<rez.length;i++) {
							for(var j=0;j<rez[i].series.length;j++) {
								series.push(rez[i].series[j])
							}
						}
						
						rezdata.series = JSON.stringify(series)
						rezdata.iebar = true
						cb1(null, rezdata)
					})
				} else {
					calculateGraphData(req.session.apiToken,type,reportSettings,cb1);
				}
			},
			function(data_,cb1){
				data = data_;
				cb1()
			},
			function(){
				data.tabs = vtabs;
				data.pmenu = {name:req.query.name,
					items:[{name:webapp.ctx.i18n(req.session.apiToken, 'cash','Page settings'),id:"settings",href:"#"}]}
				data.reportSettings = reportSettings;
				
				res.render(__dirname+"/../res/views/report", data);
			}],
			next
		);
	};

	function calculateGraphData(token, type, params, cb){
		var periods=categories=null;
		var accountsTree,accKeys;
		switch(type){
			case 'barflow':
			case 'iebar':
				periods = getPeriods(new Date(params.startDate), new Date(params.endDate));
				categories = _.map(periods, function (p) { return (p.start.getMonth()+1)+"."+p.start.getFullYear();});
			break;
			case 'pieflow':
			break;
		}
		async.waterfall([
			function (cb1) {
				cashapi.getAllAccounts(token, cb1);
			},
			function (accounts, cb1) {
				//here not filter accounts yet 
				accKeys = _(accounts).reduce(function (memo, acc) {
					memo[acc._id] = {name:acc.name, _id:acc._id, parentId:acc.parentId,summ:0,type:acc.type};
					if(periods)
						memo[acc._id].periods = _(periods).map(function (p) { return _.clone(p); });
					return memo;
				}, {});
				cashapi.getTransactionsInDateRange(token,[params.startDate,params.endDate,true,false],cb1);
			},
			function(trns,cb1){
				(function (cb) {
				async.forEach(trns, function (tr,cb) {
					cashapi.getCmdtyPrice(token,tr.currency,{space:"ISO4217",id:params.reportCurrency},null,'safe',function(err,rate){
						if(err && !(err.skilap && err.skilap.subject == "UnknownRate"))
							return cb(err);
						if (!err && rate!=0)
							var irate = rate;
						_.forEach(tr.splits, function(split) {
							var acs = accKeys[split.accountId];
							if (acs) {
								var val = split.value*irate;
								if (params.accType!=acs.type){
									acs.summ  = 0;
									val = 0;
								}
								if (params.accType == "INCOME")
									val *= -1;
								acs.summ += val;
								if (periods) {
									var d = tr.datePosted.valueOf();
									_.forEach(acs.periods, function (p) {
										if (d > p.start.valueOf() && d <= p.end.valueOf()) {
											p.summ += val;
										}
									});
								}
							}
						});
						cb();
					})
				},cb);
			})(safe.sure(cb1, function () {
				//collapse accounts to accLevel
				if(params.accLevel != 'All'){
					async.series([
						function(cb2){
							async.forEachSeries(_.keys(accKeys), function(key,cb3){
								cashapi.getAccountInfo(token,key,['level'],function(err,res){
									if (err) return cb3(err);
									accKeys[key].level = res.level;
									cb3();
								});
							},cb2);
						},
						function(cb2){
							do {
								// get current ids
								var ids = _.reduce(_.values(accKeys), function (memo, item) {
									memo[item._id] = 1;
									return memo;
								}, {})
								// remove accounts that can't be reduced now
								// accounts that have child or with level
								// not covered by collapse
								_.each(accKeys, function (item, id) {
									delete ids[item.parentId];
									if (item.level<=params.accLevel)
										delete ids[id];
									if (item.type!=params.accType)
										delete ids[id];
								})
								// reduce
								_.each(ids, function (v,id) {
									var child = accKeys[id];
									var parent = accKeys[child.parentId];
									parent.summ+=child.summ;
									parent.expand = 1;
									if (child.periods) {
										for (var i = 0 ; i<child.periods.length; i++) {
											parent.periods[i].summ+=child.periods[i].summ;
										}
									}
									delete accKeys[id];
								})
							} while (_.size(ids)!=0);
							//filter by id and type
							if(_.isArray(params.accIds) && _.size(accKeys) != params.accIds.length){
								accKeys = _.filter(accKeys, function(elem){
									if (elem.expand)
										return true;
									return _.find(params.accIds, function(item){return _.isEqual(elem._id.toString(),item.toString())}
								)});
							}
							accKeys = _(accKeys).reduce(function (memo, acc) {
								if (acc.type == params.accType || acc.expand)
									memo[acc._id] = acc;
								return memo;
							}, {});
							cb2();
						}
					],function(err){
						if(err) return cb1(err);
						cb1();
					});
				}
				else{
					//filter by id and type;
					if(_.isArray(params.accIds) && _.size(accKeys) != params.accIds.length){
						accKeys = _.filter(accKeys, function(elem){ return _.find(params.accIds, function(item){return _.isEqual(elem._id.toString(),item.toString())})});
					}
					accKeys = _(accKeys).reduce(function (memo, acc) {
						if (acc.type == params.accType)
							memo[acc._id] = acc;
						return memo;
					}, {});
					cb1();
				}
				}))
			},
			function(cb1){
				var total = 0;
				// find important accounts (with biggest summ over entire period)
				var iacs = _(accKeys).chain().map(function (acs) { return {_id:acs._id, summ:acs.summ}})
					.sortBy(function (acs) {return acs.summ}).last(params.maxAcc)
					.reduce(function (memo, acs) { memo[acs._id]=1; return memo; }, {}).value();
				// colapse non important
				var final = _(accKeys).reduce( function (memo, accKey) {
					total += accKey.summ;
					if (_(iacs).has(accKey._id))
						memo[accKey._id] = accKey;
					else {
						var other = memo['other'];
						if (other==null) {
							accKey.name = "Other";
							accKey._id = 'other';
							memo['other'] = accKey;
						} else {
							other.summ+=accKey.summ;
							if (periods)
								for(var i =0; i<other.periods.length; i++) {
									other.periods[i].summ+=accKey.periods[i].summ;
								}
						}
					}
					return memo;
				}, {});
				// transform into report form
				var report = _(final).reduce( function (memo,accKey) {
					var obj = {};
					if (periods){
						obj = {data:_(accKey.periods).pluck('summ')}
						if(type=='iebar') {
							obj.stack = accKey.type
							obj.name = ctx.i18n(token, 'cash',accKey.type.charAt(0)+accKey.type.toLowerCase().slice(1)) + ': '+accKey.name
						} else {
							obj.name = accKey.name
						}
					} else {
						obj = [accKey.name, accKey.summ];
					}
					memo.push(obj);
					return memo;
				}, [])

				cb1(null,report);

			}
		], function (err, series) {
			if(err) return cb(err);
			if(type == 'pieflow')
				series = {type:'pie', data: series};

			var data = {categories:JSON.stringify(categories), series:type == 'iebar' ? series : JSON.stringify(series)};
			data[type] = 1;
			cb(null, data);
		});
	}

	// split date range into periods
	function getPeriods (sd, ed) {
		var ret = [];
		var start = new Date(sd.valueOf());
		var end = new Date(sd.valueOf());
		while (end.valueOf() < ed.valueOf()) {
			end = new Date(start.getFullYear(),start.getMonth()+1,1);
			if (ed.valueOf()<end.valueOf())
				end = ed;
			ret.push({start:start, end:end, summ:0});
			start = end;
		}
		return ret;
	}

	function getDefaultSettings(reportName) {
		var defaultSettings = {
				startDate:dfW3C.format(new Date(new Date().getFullYear(), 0, 1)),
				endDate:dfW3C.format(new Date(new Date().getFullYear(), 11, 31)),
				accIsVisible:1,
				accType:"EXPENSE",
				maxAcc:10,
				reportName:reportName,
				accIds:null,
				accLevel:2,
				accLevelOptions:[{name:'All'},{name:1},{name:2},{name:3},{name:4},{name:5},{name:6}],
				version: reportSettingsVersion,
				reportCurrency:repCmdty.id
			};
		return defaultSettings;
	}
}
