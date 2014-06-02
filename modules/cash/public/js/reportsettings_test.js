define(["jquery","eventemitter2","safe", "jquery-block","bootstrap"], function ($,emit,safe) {
    var modal = function () {
        var self = this;
        var $modal = null;
        this.hide = function () {
            if ($modal)
                $modal.modal('hide')
        }
        this.show = function() {
            (function (cb) {
                require(['api','clitpl','lodash','moment'], function (api,tf,_, moment) {
                    var sid = $("ul.nav li.active button").attr("data-pid");
                    var batch = {
                        "settings":{
                            "cmd":"api",
                            "prm":["cash.web_getTabSettings", sid],
                            "res":{"a":"store","v":"settings"}
                        },
                        "accounts":{
                            "cmd" : "api",
                            "prm":["cash.getAllAccounts"],
                            "res":{"a":"store","v":"accounts"}
                        },
                        "currencies":{
                            "cmd":"api",
                            "prm":["cash.web_getUseRangedCurrencies"],
                            "res":{"a":"store","v":"currencies"}
                        },
                        "accTypes":{
                            "cmd":"api",
                            "prm":["cash.getAssetsTypes"],
                            "res":{"a":"store","v":"accTypes"}
                        }
                    }
                    api.batch(batch, safe.sure(cb, function (data) {
                        var curf = false;
                        _.forEach(data.currencies.used, function(curr){
                            if (curr.iso == data.settings.reportCurrency){
                                curr.isSelected = 1;
                                curf = true;
                                return;
                            }
                        })
                        if (!curf)
                            _.forEach(data.currencies.unused, function(curr){
                                if (curr.iso == data.settings.reportCurrency){
                                    curr.isSelected = 1;
                                    curf = true;
                                    return;
                                }
                            })
                        data.accounts = _(data.accounts).reduce(function(memo,item){
                            if (_.isNull(data.settings.accIds)){
                                item.isSelected = 1;
                                memo.push(item);
                            }
                            else{
                                if(!_.isUndefined(_.find(data.settings.accIds, function(elem){return _.isEqual(elem.toString(), item._id.toString())})))
                                    item.isSelected = 1;
                                memo.push(item);
                            }
                            return memo;
                        },[]);
                        //make tree
                        var oAccounts = _.reduce(data.accounts,function(memo,item){
                            memo[item._id] = _.clone(item);
                            memo[item._id].childs=[];
                            return memo;
                        },{});

                        _.forEach(_.keys(oAccounts),function(key){
                            if(oAccounts[key].parentId){
                                oAccounts[oAccounts[key].parentId].childs.push(oAccounts[key]);
                            }
                        });
                        data.accounts = _.filter(_.values(oAccounts),function(item){
                            return (!item.parentId && !item.hidden);
                        });
                        //set accLevel
                        _.forEach(data.settings.accLevelOptions, function(alO){
                            if (alO.name == data.settings.accLevel){
                                alO.isSelected = 1;
                                return;
                            }
                        })
                        //set accType
                        _.forEach(data.accTypes, function(alO){
                            if (alO.value == data.settings.accType){
                                alO.isSelected = 1;
                                return;
                            }
                        })
                        data.settings.startDate = new moment.utc(data.settings.startDate).format("MM/DD/YYYY");
                        data.settings.endDate = new moment.utc(data.settings.endDate).format("MM/DD/YYYY");
                        tf.render('reportsettings_test', data, safe.sure(cb,function(text, ctx) {
                            self.emit('shown');
                            $("body").append(text);
                            $modal = $("#"+ctx.uniq).modal();
                            $modal.on('frm-saved', function (evt,acc) {
                                self.emit('result','saved', acc)
                            })
                            $modal.on('hidden', function () {
                                self.emit('result','closed')
                            })
                        }))
                    }))
                },cb)
            })(function (err) {
                if (err) appError(err);
            })
        }
    }
    safe.inherits(modal,emit);
    return modal;
})
