{"layout":{"p":"layout","tf":"function (Handlebars,depth0,helpers,partials,data) {\n  this.compilerInfo = [2,'>= 1.0.0-rc.3'];\nhelpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};\n  var buffer = \"\", stack1, stack2, options, functionType=\"function\", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;\n\nfunction program1(depth0,data) {\n  \n  \n  return \"Core\";\n  }\n\nfunction program3(depth0,data) {\n  \n  var buffer = \"\", stack1, stack2, options;\n  buffer += \"\\n            <ul class=\\\"nav nav-pills\\\">\\n              <li \";\n  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};\n  if (stack1 = helpers.pageUserActive) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.pageUserActive; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.pageUserActive) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \">\\n\t\t\t\t\";\n  stack2 = helpers['if'].call(depth0, ((stack1 = ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1.perm)),stack1 == null || stack1 === false ? stack1 : stack1.core_me_view), {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t\t\t  </li>\\n              <li \";\n  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};\n  if (stack2 = helpers.pageUsersActive) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.pageUsersActive; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.pageUsersActive) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \">\\n\t\t\t\t\";\n  stack2 = helpers['if'].call(depth0, ((stack1 = ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1.perm)),stack1 == null || stack1 === false ? stack1 : stack1.core_user_view), {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t\t\t  </li>\\n              <li \";\n  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};\n  if (stack2 = helpers.pageSystemSettingsActive) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.pageSystemSettingsActive; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.pageSystemSettingsActive) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \">\\n\t\t\t\t\";\n  stack2 = helpers['if'].call(depth0, ((stack1 = ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1.perm)),stack1 == null || stack1 === false ? stack1 : stack1.core_sysadmin), {hash:{},inverse:self.noop,fn:self.program(12, program12, data),data:data});\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t\t\t  </li>\\n\t\t\t  <li>\\n\t\t\t\t<a href=\\\"/logout?success=\";\n  if (stack2 = helpers.url) { stack2 = stack2.call(depth0, {hash:{},data:data}); }\n  else { stack2 = depth0.url; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  buffer += escapeExpression(stack2)\n    + \"\\\">\";\n  options = {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data};\n  if (stack2 = helpers.i18n) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.i18n; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.i18n) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"</a>\\n\t\t\t  </li>\\n            </ul>\\n           \";\n  return buffer;\n  }\nfunction program4(depth0,data) {\n  \n  \n  return \"class=\\\"active\\\"\";\n  }\n\nfunction program6(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"<a href=\\\"\";\n  if (stack1 = helpers.prefix) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.prefix; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"/user\\\">\";\n  options = {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</a>\";\n  return buffer;\n  }\nfunction program7(depth0,data) {\n  \n  \n  return \"My account\";\n  }\n\nfunction program9(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"<a href=\\\"\";\n  if (stack1 = helpers.prefix) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.prefix; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"/users\\\">\";\n  options = {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</a>\";\n  return buffer;\n  }\nfunction program10(depth0,data) {\n  \n  \n  return \"Manage users\";\n  }\n\nfunction program12(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"<a href=\\\"\";\n  if (stack1 = helpers.prefix) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.prefix; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"/sysset\\\">\";\n  options = {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</a>\";\n  return buffer;\n  }\nfunction program13(depth0,data) {\n  \n  \n  return \"System settings\";\n  }\n\nfunction program15(depth0,data) {\n  \n  \n  return \"Logout\";\n  }\n\nfunction program17(depth0,data) {\n  \n  \n  return \"Copyright by PushOk Software\";\n  }\n\n  buffer += \"<!DOCTYPE HTML>\\n<html lang=\\\"en-us\\\">\\n<head>\\n\t<meta http-equiv=\\\"Content-type\\\" content=\\\"text/html; charset=utf-8\\\">\\n\t<meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">\\n\t<title>\";\n  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"</title>\\n\t <!-- Le styles -->\\n\t<link href=\\\"/core/css/bootstrap.css\\\" rel=\\\"stylesheet\\\">\\n\t<link href=\\\"/core/css/responsive.css\\\" rel=\\\"stylesheet\\\">\\n\t<link href=\\\"/core/css/main.css\\\" rel=\\\"stylesheet\\\">\\n    <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->\\n    <!--[if lt IE 9]>\\n      <script src=\\\"http://html5shim.googlecode.com/svn/trunk/html5.js\\\"></script>\\n    <![endif]-->\\n    <script src=\\\"/common/js/require.js\\\"></script>\\n\t<script>\\n\t\tvar _apiToken = '\";\n  if (stack1 = helpers.apiToken) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.apiToken; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"';\\n\t\tvar _user = {_id:'\"\n    + escapeExpression(((stack1 = ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1._id)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))\n    + \"',language:\\\"\"\n    + escapeExpression(((stack1 = ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1.language)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))\n    + \"\\\"};\\n\t\tvar _prefix = '\";\n  if (stack2 = helpers.prefix) { stack2 = stack2.call(depth0, {hash:{},data:data}); }\n  else { stack2 = depth0.prefix; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  buffer += escapeExpression(stack2)\n    + \"';\\n\t</script>\\n    <script src=\\\"\";\n  if (stack2 = helpers.prefix) { stack2 = stack2.call(depth0, {hash:{},data:data}); }\n  else { stack2 = depth0.prefix; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  buffer += escapeExpression(stack2)\n    + \"/js/app\";\n  if (stack2 = helpers.relisets) { stack2 = stack2.call(depth0, {hash:{},data:data}); }\n  else { stack2 = depth0.relisets; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  buffer += escapeExpression(stack2)\n    + \".js\\\"></script>\\n</head>\\n<body>\\n\t<div class=\\\"navbar navbar-fixed-top navbar-inverse\\\">\\n      <div class=\\\"navbar-inner\\\">\\n        <div class=\\\"container\\\">\\n          <a class=\\\"btn btn-navbar\\\" data-toggle=\\\"collapse\\\" data-target=\\\".nav-collapse\\\">\\n            <span class=\\\"icon-bar\\\"></span>\\n            <span class=\\\"icon-bar\\\"></span>\\n            <span class=\\\"icon-bar\\\"></span>\\n          </a>\\n          <a href='/' id=\\\"logoNew\\\"></a>\\n\t\t  <a class=\\\"brand\\\" href=\\\"#\\\">\";\n  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};\n  if (stack2 = helpers.i18n) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.i18n; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.i18n) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"</a>\\n          <div class=\\\"nav-collapse\\\">\\n          \";\n  stack2 = helpers['if'].call(depth0, ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1.loggedin), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n          </div><!--/.nav-collapse -->\\n        </div>\\n      </div>\\n    </div>\\n    <div class=\\\"container context\\\">\\n\t\t\";\n  stack2 = self.invokePartial(partials.content, 'content', depth0, helpers, partials, data);\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n    </div>\\n\t<footer class=\\\"footer\\\">\\n    <div class=\\\"container\\\">\\n\t\t<br><br><br><br>\\n\t\t<p class=\\\"well-small well\\\">&copy; \";\n  options = {hash:{},inverse:self.noop,fn:self.program(17, program17, data),data:data};\n  if (stack2 = helpers.i18n) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.i18n; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.i18n) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \" 2011-2013</p>\\n\t</div>\\n\t</footer>\\n</body>\\n</html>\\n\";\n  return buffer;\n  }","mt":1412000137000,"pt":["content"]},"content":{"p":"content","tf":"function (Handlebars,depth0,helpers,partials,data) {\n  this.compilerInfo = [2,'>= 1.0.0-rc.3'];\nhelpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};\n  var buffer = \"\", stack1, stack2, options, self=this, functionType=\"function\", blockHelperMissing=helpers.blockHelperMissing;\n\nfunction program1(depth0,data) {\n  \n  \n  return \"Your prefferences\";\n  }\n\nfunction program3(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"<a href=\\\"javascript:void(0);\\\" id=\\\"edit-pref\\\">\";\n  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</a>\";\n  return buffer;\n  }\nfunction program4(depth0,data) {\n  \n  \n  return \"edit\";\n  }\n\nfunction program6(depth0,data) {\n  \n  \n  return \"Your permissions\";\n  }\n\nfunction program8(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"<a href=\\\"javascript:void(0);\\\" id=\\\"edit-perm\\\">\";\n  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</a>\";\n  return buffer;\n  }\n\n  buffer += \"<div id=\\\"user\\\" class=\\\"row\\\">\\n\t<div class=\\\"span6\\\">\\n\t\t<h2>\";\n  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</h2>\\n\t\t\";\n  stack2 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1.perm)),stack1 == null || stack1 === false ? stack1 : stack1.core_me_edit)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data}));\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t\t\";\n  stack2 = self.invokePartial(partials.user_prefs, 'user_prefs', depth0, helpers, partials, data);\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t</div>\\n\t<div class=\\\"span6\\\">\\n\t\t<h2>\";\n  options = {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data};\n  if (stack2 = helpers.i18n) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.i18n; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.i18n) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"</h2>\\n\t\t\";\n  stack2 = ((stack1 = ((stack1 = ((stack1 = ((stack1 = depth0.user),stack1 == null || stack1 === false ? stack1 : stack1.perm)),stack1 == null || stack1 === false ? stack1 : stack1.core_user_edit)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data}));\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t\t\";\n  stack2 = self.invokePartial(partials.user_perm, 'user_perm', depth0, helpers, partials, data);\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t</div>\\n</div>\\n<script>\\nrequire([\\\"jquery\\\",\\\"jquery-block\\\"], function($){\\n\t$(function(e) {\\n\t\t$(\\\"#edit-pref\\\").on(\\\"click\\\", function() {\\n\t\t\t$this = $(this);\\n\t\t\tvar $me = $(this).parent()\\n\t\t\t$me.block();\\n\t\t\t(function (cb) {\\n\t\t\t\trequire(['api','clitpl','safe','bootstrap'], function (api,tf,safe) {\\n\t\t\t\t\tapi.call('core.getUser', safe.sure(cb, function (user) {\\n\t\t\t\t\t\ttf.render('user_prefs_edit', {luser:user}, safe.sure(cb,function(text, ctx) {\\n\t\t\t\t\t\t\t$me.unblock();\\n\t\t\t\t\t\t\t$(\\\"body\\\").append(text);\\n\t\t\t\t\t\t\tvar $modal = $(\\\"#\\\"+ctx.uniq).modal();\\n\t\t\t\t\t\t\t$modal.on(\\\"frm-saved\\\", function () {\\n\t\t\t\t\t\t\t\tapi.call('core.getUser', safe.sure(cb, function (user) {\\n\t\t\t\t\t\t\t\t\ttf.render('user_prefs',{user_: user}, safe.sure(cb, function(text) {\\n\t\t\t\t\t\t\t\t\t\t$me.find(\\\"#user_prefs\\\").remove();\\n\t\t\t\t\t\t\t\t\t\t$this.after(text)\\n\t\t\t\t\t\t\t\t\t\t$modal.modal('hide')\\n\t\t\t\t\t\t\t\t\t\tcb();\\n\t\t\t\t\t\t\t\t\t}))\\n\t\t\t\t\t\t\t\t}))\\n\t\t\t\t\t\t\t})\\n\t\t\t\t\t\t}))\\n\t\t\t\t\t}))\\n\t\t\t\t},cb)\\n\t\t\t})(function (err) {\\n\t\t\t\tif (err) appError(err);\\n\t\t\t\t$me.unblock();\\n\t\t\t})\\n\t\t\treturn false;\\n\t\t})\\n\t\t$(\\\"#edit-perm\\\").on(\\\"click\\\", function() {\\n\t\t\t$this = $(this);\\n\t\t\tvar $me = $(this).parent()\\n\t\t\t$me.block();\\n\t\t\t(function (cb) {\\n\t\t\t\trequire(['api','clitpl','safe','bootstrap'], function (api,tf,safe) {\\n\t\t\t\t\tapi.call('core.getUser', safe.sure(cb, function (user) {\\n\t\t\t\t\t\tapi.call('core.getUserPermissions', user, safe.sure(cb, function (permissions) {\\n\t\t\t\t\t\t\ttf.render('user_perm_edit', {permissions: permissions, luser: user}, safe.sure(cb,function(text, ctx) {\\n\t\t\t\t\t\t\t\t$me.unblock();\\n\t\t\t\t\t\t\t\t$(\\\"body\\\").append(text);\\n\t\t\t\t\t\t\t\tvar $modal = $(\\\"#\\\"+ctx.uniq).modal();\\n\t\t\t\t\t\t\t\t$modal.on(\\\"frm-saved\\\", function (permissions) {\\n\t\t\t\t\t\t\t\t\tapi.call('core.getUserPermissions', user, safe.sure(cb, function (permissions) {\\n\t\t\t\t\t\t\t\t\t\ttf.render('user_perm',{permissions: permissions, user: user}, safe.sure(cb, function(text) {\\n\t\t\t\t\t\t\t\t\t\t\t$me.find(\\\"#user_perm\\\").remove();\\n\t\t\t\t\t\t\t\t\t\t\t$this.after(text)\\n\t\t\t\t\t\t\t\t\t\t\t$modal.modal('hide')\\n\t\t\t\t\t\t\t\t\t\t\tcb();\\n\t\t\t\t\t\t\t\t\t\t}))\\n\t\t\t\t\t\t\t\t\t}))\\n\t\t\t\t\t\t\t\t})\\n\t\t\t\t\t\t\t}))\\n\t\t\t\t\t\t}))\\n\t\t\t\t\t}))\\n\t\t\t\t},cb)\\n\t\t\t})(function (err) {\\n\t\t\t\tif (err) appError(err);\\n\t\t\t\t$me.unblock();\\n\t\t\t})\\n\t\t\treturn false;\\n\t\t})\\n\t})\\n}, appError)\\n</script>\\n\";\n  return buffer;\n  }","mt":1412000137000,"pt":["user_prefs","user_perm"]},"user_prefs":{"p":"user_prefs","tf":"function (Handlebars,depth0,helpers,partials,data) {\n  this.compilerInfo = [2,'>= 1.0.0-rc.3'];\nhelpers = helpers || Handlebars.helpers; data = data || {};\n  var buffer = \"\", stack1, self=this, functionType=\"function\", blockHelperMissing=helpers.blockHelperMissing, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;\n\nfunction program1(depth0,data) {\n  \n  var buffer = \"\", stack1, stack2, options;\n  buffer += \"\\n<table class=\\\"table\\\" id=\\\"user_prefs\\\">\\n\t<tbody>\\n\t\t\";\n  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};\n  stack2 = ((stack1 = helpers.when),stack1 ? stack1.call(depth0, depth0.type, \"!=\", \"guest\", options) : helperMissing.call(depth0, \"when\", depth0.type, \"!=\", \"guest\", options));\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"\\n\t\t<tr>\\n\t\t\t<td>\";\n  options = {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data};\n  if (stack2 = helpers.i18n) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.i18n; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.i18n) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"</td><td>\";\n  if (stack2 = helpers.language) { stack2 = stack2.call(depth0, {hash:{},data:data}); }\n  else { stack2 = depth0.language; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  buffer += escapeExpression(stack2)\n    + \"</td>\\n\t\t</tr>\\n\t\t<tr>\\n\t\t\t<td>\";\n  options = {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data};\n  if (stack2 = helpers.i18n) { stack2 = stack2.call(depth0, options); }\n  else { stack2 = depth0.i18n; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  if (!helpers.i18n) { stack2 = blockHelperMissing.call(depth0, stack2, options); }\n  if(stack2 || stack2 === 0) { buffer += stack2; }\n  buffer += \"</td><td>\";\n  if (stack2 = helpers.timeZone) { stack2 = stack2.call(depth0, {hash:{},data:data}); }\n  else { stack2 = depth0.timeZone; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }\n  buffer += escapeExpression(stack2)\n    + \"</td>\\n\t\t</tr>\\n\t</tbody>\\n</table>\\n\";\n  return buffer;\n  }\nfunction program2(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"\t\\n\t\t<tr>\\n\t\t\t<td>\";\n  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</td><td>\";\n  if (stack1 = helpers.firstName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.firstName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"</td>\\n\t\t</tr>\\n\t\t<tr>\\n\t\t\t<td>\";\n  options = {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</td><td>\";\n  if (stack1 = helpers.lastName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.lastName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"</td>\\n\t\t</tr>\\n\t\t<tr>\\n\t\t\t<td>\";\n  options = {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data};\n  if (stack1 = helpers.i18n) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.i18n; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.i18n) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"</td><td>\";\n  if (stack1 = helpers.login) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.login; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"</td>\\n\t\t</tr>\\n\t\t\";\n  return buffer;\n  }\nfunction program3(depth0,data) {\n  \n  \n  return \"First name\";\n  }\n\nfunction program5(depth0,data) {\n  \n  \n  return \"Last name\";\n  }\n\nfunction program7(depth0,data) {\n  \n  \n  return \"Login\";\n  }\n\nfunction program9(depth0,data) {\n  \n  \n  return \"Gui language\";\n  }\n\nfunction program11(depth0,data) {\n  \n  \n  return \"Timezone\";\n  }\n\n  stack1 = helpers['with'].call(depth0, depth0.user_, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"\\n\";\n  return buffer;\n  }","mt":1412000137000,"pt":[]},"user_perm":{"p":"user_perm","tf":"function (Handlebars,depth0,helpers,partials,data) {\n  this.compilerInfo = [2,'>= 1.0.0-rc.3'];\nhelpers = helpers || Handlebars.helpers; data = data || {};\n  var buffer = \"\", stack1, options, functionType=\"function\", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;\n\nfunction program1(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"\\n\t\t<h4>\";\n  if (stack1 = helpers.module) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.module; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \":</h4>\\n\t\t\";\n  options = {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data};\n  if (stack1 = helpers.perm) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.perm; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.perm) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"\\n\t\";\n  return buffer;\n  }\nfunction program2(depth0,data) {\n  \n  var buffer = \"\", stack1, options;\n  buffer += \"\\n\t\t\t\";\n  options = {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data};\n  if (stack1 = helpers.val) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.val; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.val) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"\\n\t\t\";\n  return buffer;\n  }\nfunction program3(depth0,data) {\n  \n  var buffer = \"\", stack1;\n  buffer += \"&nbsp;&nbsp;&nbsp;\";\n  if (stack1 = helpers.desc) { stack1 = stack1.call(depth0, {hash:{},data:data}); }\n  else { stack1 = depth0.desc; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  buffer += escapeExpression(stack1)\n    + \"<br />\";\n  return buffer;\n  }\n\n  buffer += \"<div id=\\\"user_perm\\\">\\n\t<hr class=\\\"no-margin-top\\\">\\n\t\";\n  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};\n  if (stack1 = helpers.permissions) { stack1 = stack1.call(depth0, options); }\n  else { stack1 = depth0.permissions; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }\n  if (!helpers.permissions) { stack1 = blockHelperMissing.call(depth0, stack1, options); }\n  if(stack1 || stack1 === 0) { buffer += stack1; }\n  buffer += \"\\n</div>\\n\";\n  return buffer;\n  }","mt":1412000137000,"pt":[]},"hogan":{"v":4,"st":"layout"}}