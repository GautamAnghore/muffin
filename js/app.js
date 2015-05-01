// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
// |||||||||||||||||||||||||||||||||| Initialisations |||||||||||||||||||||||||||||||||||||||||||||
// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

// Application namespace
var App = {};

// kinvey initialisation
Kinvey.init({
	appKey: 'kid_-JNL0sgZyl',
	appSecret: '89f8ac1f88a34210898ab2540ec71513'
})
.then(function(activeUser) {
	
	console.log("Kinvey Connection Success");

	var promise = Kinvey.ping();
	promise.then(function(response) {
		console.log("Kinvey Ping Success : response version : " + response.version + " response: " + response.kinvey);
		
		// setting the active user
		App.user = new App.UserModel(activeUser); 

		// initialising errorMsg as empty
		App.errorMsg = "";

		// setting the router
		// placed here as we need to trigger the router 
		// only after Kinvey is connected before any call to 
		// Kinvey functions or variable is made
		App.router = new App.AppRouter();
		Backbone.history.start();

	}, function(error) {
		console.log("Kinvey Ping failure : Error : " + error.description);
	});

}, function(error) {
	console.log("Kinvey Connection Failure : Error : " + error.description);
	alert("Kinvey Connection Failure, cannot proceed");
});

// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
// |||||||||||||||||||||||||||||| Helper functions ||||||||||||||||||||||||||||||||||||||||||||||||
// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

// source : https://github.com/thomasdavis/backbonetutorials/tree/gh-pages/videos/beginner#preventing-xss
// to prevent xss script that might be coming from server
function htmlEncode(value){
  return $('<div/>').text(value).html();
}

// get date
function getStringDate(numberOfDays)
{
	var date = new Date();
	date.setDate(date.getDate() + numberOfDays);
	var dd = date.getDate();
	var month = date.getMonth() + 1;
	var year = date.getFullYear();
	return year + "/" + month + "/" + dd;
}

// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
// |||||||||||||||||||||||||| Models and Collections ||||||||||||||||||||||||||||||||||||||||||||||
// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
App.UserModel = Backbone.Model.extend({
	defaults: {
		username: '',	
		password: '',
		fname: '',		//first name
		lname: '',		//last name
		email: '',		//email address
		org: '',		//organization of user	
		admin: false	//is the user admin of organization
	}
});
App.UserCollection = Backbone.Model.extend({
	model: App.UserModel
});

// Extending user model to use with kinvey
_.extend(App.UserModel.prototype, Kinvey.Backbone.UserMixin);
_.extend(App.UserModel, Kinvey.Backbone.StaticUserMixin);

// Extending user collection to use with kinvey
_.extend(App.UserCollection.prototype, Kinvey.Backbone.UserCollectionMixin);

App.Entry = Backbone.Model.extend({
	url: 'entry-book',
	defaults: {
		amount : 0,
		tag : undefined,
		details : undefined
	}
});
_.extend(App.Entry.prototype, Kinvey.Backbone.ModelMixin);

App.EntryBook = Backbone.Collection.extend({
	model: App.Entry,
	url: 'entry-book'
});
_.extend(App.EntryBook.prototype, Kinvey.Backbone.CollectionMixin);

App.entryBook = new App.EntryBook([]);

App.Message = Backbone.Model.extend({
	defaults: {
		msg: "",
		error: "",
		success: ""
	}
});

App.message = new App.Message({});


// Helper function to set the message(msg, success, error) in such a way that
// the message get cleared after some time interval.
// there might be a case if a new msg was added recently, so the timeout function has to
// be reset. As otherwise new msg will not be shown long enough.

App.chronMsgClear = null;
function updateMessage(obj)
{
	//first check if there is already a timer running
	//if yes clear that
	if(App.chronMsgClear) {
		clearTimeout(App.chronMsgClear);
		App.chronMsgClear = null; 
	}

	// update the App.message with 'old message + new message'
	var temp = {};
	temp.msg = App.message.get('msg') + (obj.msg ? obj.msg : '');
	temp.success = App.message.get('success') + (obj.success ? obj.success : '');
	temp.error = App.message.get('error') + (obj.error ? obj.error : '');

	App.message.set(temp);

	// set the timer to clear the message after 3 sec
	App.chronMsgClear = setTimeout(function () {
		App.message.set({
			msg: "",
			error: "",
			success: ""
		});
	},3000);
}
// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
// |||||||||||||||||||||||||||||||||| Views |||||||||||||||||||||||||||||||||||||||||||||||||||||||
// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
App.HomeView = Backbone.View.extend({
	el: '.container-holder',
	template: _.template($('#home-template').html()),
	render: function() {
		this.$el.html(this.template(App.user));
	}
});

App.SignupView = Backbone.View.extend({
	el: '.container-holder',
	template: _.template($('#signup-template').html()),
	render: function() {
		this.$el.html(this.template());
	},
	events: {
		"submit #signup-form" : "checkAndSaveUser"
	},
	checkAndSaveUser: function(ev) {
		$('#signup-fieldset').attr("disabled","disabled");
		$('#signup-submit-button').attr("disabled","disabled");
		
		var safe = {};

		// TODO : validate the content and make it safe
		safe.fname = $("#fname").val().trim();
		safe.lname = $("#lname").val().trim(); 
		safe.org = $("#org").val().trim();
		safe.username = $("#username").val().trim();
		safe.password = $("#password").val().trim();
		safe.confirm = $("#confirm").val().trim();
		safe.email = $("#email").val().trim();

		if(safe.password === safe.confirm) {
			
			// TODO : check if the organization already has been created
			// 	      alert user about it

			App.user = new App.UserModel();
			var promise = App.user.save({
				username: safe.username,
				password: safe.password,
				fname: safe.fname,
				lname: safe.lname,
				email: safe.email,
				org: safe.org,
				admin: true 
			}, {
				success: function(model, response, options) {
					//TODO : navigate to the dashboard
					App.router.navigate('dashboard', {trigger: true});
				},
				error: function(model, error, options) {
					App.errorMsg += "Error while creating User : " + error.description;
					App.router.navigate('', {trigger: true});
				}
			});

		}
		else {
			// clear the password fields
			$("#password").val('');
			$("#confirm").val('');
			//show red for error
			$("#password").parent().removeClass("has-success").addClass("has-error");
			$("#confirm").parent().removeClass("has-success").addClass("has-error");
			// reactivate the form
			$('#signup-fieldset').removeAttr("disabled");
			$('#signup-submit-button').removeAttr("disabled");

			$(".error-block").html("Passwords do not match");
		}

		return false;
	}
});


App.LoginView = Backbone.View.extend({
	el: '.container-holder',
	template: _.template($('#login-template').html()),
	render: function() {
		this.$el.html(this.template());
	},
	events: {
		"submit #login-form" : "checkAndLogin"
	},
	checkAndLogin: function(ev) {
		$('#login-fieldset').attr("disabled","disabled");
		$('#login-submit-button').attr("disabled","disabled");
		
		var safe = {};

		// TODO : validate the content and make it safe
		safe.username = $("#username").val().trim();
		safe.password = $("#password").val().trim();

		App.user = new App.UserModel();
		var promise = App.user.login({
			username: safe.username,
			password: safe.password
		}, {
			success: function(model, response, options) {
				//TODO : navigate to the dashboard
				App.user = Kinvey.Backbone.getActiveUser();
				App.user.me({
					success: function(model, response, options) {
						App.router.navigate("dashboard", {trigger: true});
					}
				});
			},
			error: function(model, error, options) {
				
				$("#password").val('');
				//show red for error
				$("#password").parent().removeClass("has-success").addClass("has-error");
				$("#username").parent().removeClass("has-success").addClass("has-error");
				// reactivate the form
				$('#login-fieldset').removeAttr("disabled");
				$('#login-submit-button').removeAttr("disabled");

				$(".error-block").html("Error : " + error.description);

			}
		});

		return false;
	}
});

App.DashboardView = Backbone.View.extend({
	el: ".container-holder",
	template: _.template($("#dashboard-template").html()),
	initialize: function() {
		this.headerView = new App.HeaderView();
		this.sidebarView = new App.SidebarView();
		this.contentView = new App.ContentView();
		this.footerView = new App.FooterView();
	},
	render: function() {
		this.$el.html(this.template());

		this.headerView.setElement(this.$('.main-header')).render();
		this.sidebarView.setElement(this.$('.main-sidebar')).render();
		this.contentView.setElement(this.$('.content-wrapper')).render();
		this.footerView.setElement(this.$('.main-footer')).render();

	}
});

App.HeaderView = Backbone.View.extend({
	el: ".main-header",
	template: _.template($("#headerview-template").html()),
	render: function() {
		this.$el.html(this.template({user: App.user}));
	}
});

App.SidebarView = Backbone.View.extend({
	el: ".main-sidebar",
	template: _.template($("#sidebarview-template").html()),
	render: function() {
		this.$el.html(this.template());
	}
});

App.FooterView = Backbone.View.extend({
	el: ".main-footer",
	template: _.template($("#footerview-template").html()),
	render: function() {
		this.$el.html(this.template());
	}
});

App.ContentView = Backbone.View.extend({
	el: ".content-wrapper",
	template: _.template($("#contentview-template").html()),
	initialize: function() {
		this.messageView = new App.MessageView();
		this.newExpenseView = new App.NewExpenseView();
		this.newIncomeView = new App.NewIncomeView();
		this.recentExpenseView = new App.RecentExpenseView(this.newExpenseView.model);
		this.recentIncomeView = new App.RecentIncomeView(this.newIncomeView.model);
		this.reportChartView = new App.ReportChartView(this.recentExpenseView.collection,this.recentIncomeView.collection);
	},
	render: function() {
		this.$el.html(this.template());
		this.messageView.setElement(this.$('.message-block')).render();
		$("#row-1").append(this.reportChartView.render().el);
		$("#row-2").append(this.newExpenseView.render().el);
		$("#row-2").append(this.newIncomeView.render().el);
		$("#row-3").append(this.recentExpenseView.render().el);
		$("#row-3").append(this.recentIncomeView.render().el);
	}
});

// to show the error and success messages
App.MessageView = Backbone.View.extend({
	el: ".message-block",
	template: _.template($("#messageview-template").html()),
	model: App.message,
	initialize: function() {
		this.model.on('change', this.render, this);
	},
	render: function() {
		this.$el.html(this.template(this.model));
	}
});

App.NewExpenseView = Backbone.View.extend({
	tagName: "div",
	template: _.template($("#newexpenseview-template").html()),
	initialize: function() {
		this.model = new App.Entry({});

		this.model.on('sync', this.render, this);
	},
	render: function() {

		this.model.clear({silent: true});
		this.$el.html(this.template());
		return this;
	},
	events: {
		"submit #newexpense-form": "checkAndSave"
	},
	checkAndSave: function() {
		$("#newexpense-fieldset").attr("disabled","disabled");
		$("#newexpense-submit").attr("disabled","disabled");

		this.model.save(this.getAttributes(), {
			success: function(model, response, options) {
				//console.log(response);
				//console.log("data added successfully");
				
				updateMessage({
					success: " New Expense Added successfully. "	
				});
			},
			error: function(model, error, options) {
				$(".newexpense-error-block").html(error.description);
				
				$("#newexpense-fieldset").removeAttr("disabled");
				$("#newexpense-submit").removeAttr("disabled");
			}

		});

		return false;
	},
	getAttributes: function() {
		var safe = {};
		
		safe.amount = parseInt($("#expense-amt").val().trim());
		safe.tag = $("#expense-tag").val().trim();
		safe.details = $("#expense-detail").val().trim();
		
		//TODO : may be we need to update the user information using user.me()
		//waiting for me before return problem
		safe.user = App.user.get('username');
		safe.org = App.user.get('org');
		safe.type = "debit";
		//0 for current date string
		safe.date = getStringDate(0); 
		return safe;

	}

});

App.NewIncomeView = Backbone.View.extend({
	tagName: "div",
	template: _.template($("#newincomeview-template").html()),
	initialize: function() {
		this.model = new App.Entry({});

		// 'change' event monitor only local change
		// 'sync' event is fired when the data is changed on server
		// and a success response is recieved
		this.model.on('sync', this.render, this);
	},
	render: function() {
		
		// all attributes cleared so that the existing record is not 
		// updated as a result of save
		// silent:true to avoid firing the change event
		this.model.clear({silent: true});

		this.$el.html(this.template());
		return this;
	},
	events: {
		"submit #newincome-form": "checkAndSave"
	},
	checkAndSave: function() {
		$("#newincome-fieldset").attr("disabled","disabled");
		$("#newincome-submit").attr("disabled","disabled");

		this.model.save(this.getAttributes(), {
			success: function(model, response, options) {
				//console.log(response);
				//console.log("data added successfully");
				updateMessage({
					success: " New Income Added successfully. "	
				});
			},
			error: function(model, error, options) {
				$(".newincome-error-block").html(error.description);
				
				$("#income-error-tag").style.visibility = visible; 
				$("#newincome-fieldset").removeAttr("disabled");
				$("#newincome-submit").removeAttr("disabled");
			}

		});

		return false;
	},
	getAttributes: function() {
		var safe = {};
		
		safe.amount = parseInt($("#income-amt").val().trim());
		safe.tag = $("#income-tag").val().trim();
		safe.details = $("#income-detail").val().trim();
		
		//TODO : may be we need to update the user information using user.me()
		//waiting for me before return problem
		safe.user = App.user.get('username');
		safe.org = App.user.get('org');
		safe.type = "credit";
		
		safe.date = getStringDate(0);
		return safe;

	}


});

App.RecentExpenseView = Backbone.View.extend({
	tagName: "div",
	template: _.template($("#recentexpenseview-template").html()),
	initialize: function(obj) {
		//whenever there is addition of data in collection, rerender
		// it must have been implemented using App.entryBook
		// TODO
		//App.entryBook.on('add', this.render, this);
		
		//this is monitoring if new data is being synced with server
		// and if yes then it is getting updated
		obj.on('sync', this.render, this);

		this.collection = new App.EntryBook([]);
	},
	render: function() {

		var that = this;

		var query = new Kinvey.Query();
		query.equalTo('user',App.user.get('username'))
				.and()
				.equalTo('type','debit')
				.descending('date')
				.limit(5);

		this.collection.fetch({
			query: query,
			success: function(collection, response, options) {
				//console.log(collection);
				that.$el.html(that.template({results: collection.toJSON()}));		
			},
			error: function(collection, error, options) {
				updateMessage({
					error: error.description
				});
				
			}
		});

		// returning is necessary here and not in the callback function of fetch as
		// otherwise at the time of rendering, this view will not return anything and
		// not get attached to the main DOM
		return this;
		

	}
});

App.RecentIncomeView = Backbone.View.extend({
	tagName: "div",
	template: _.template($("#recentincomeview-template").html()),
	initialize: function(obj) {
		obj.on('sync', this.render, this);

		this.collection = new App.EntryBook([]);
	},
	render: function() {

		var that = this;

		var query = new Kinvey.Query();
		query.equalTo('user',App.user.get('username'))
				.and()
				.equalTo('type','credit')
				.descending('date')
				.limit(5);

		this.collection.fetch({
			query: query,
			success: function(collection, response, options) {
				//console.log(collection);
				that.$el.html(that.template({results: collection.toJSON()}));		
			},
			error: function(collection, error, options) {
				updateMessage({
					error: error.description
				});
				
			}
		});
		return this;
		
	}
});

App.ReportChartView = Backbone.View.extend({
	tagName: "div",
	template: _.template($("#reportchartview-template").html()),
	initialize: function(expense, income) {

		this.expenseCollection = new App.EntryBook([]);
		this.incomeCollection = new App.EntryBook([]);
		this.jsonResult = [];
		//this.chart = null;
		//this.expenseCollection.on('sync', this.render, this);
		//this.incomeCollection.on('sync', this.render, this);

		expense.on('sync', this.updateChart, this);
		income.on('sync', this.updateChart, this);
		
		this.collection = new App.EntryBook([]);
	},
	render: function() {
		
		// first fetch the debit/expense data
		var query = new Kinvey.Query();
		query.equalTo('user', App.user.get('username'))
				.and()
				.equalTo('type','debit')
				.and()
				.greaterThanOrEqualTo('date', getStringDate(-365))
				.descending('date');

		var that = this;
		this.expenseCollection.fetch({

			//then fetch the credit/income data
			query: query,
			success: function(collection, response, options) {
				
				// TODO : split the generateGraph() function to 
				// populate the jsonResult for income and expense
				// individually and call the function for expense 
				// as the expense data is ready.

				var query = new Kinvey.Query();
				query.equalTo('user',App.user.get('username'))
						.and()
						.equalTo('type','credit')
						.and()
						.greaterThanOrEqualTo('date', getStringDate(-365))
						.descending('date');
				
				var _that = that;
				that.incomeCollection.fetch({
					query: query,
					success: function(collection, response, options) {
						//this has to be broken down
						_that.generateGraphData();
						_that.renderChart();		
					},
					error: function(collection, error, options) {
						updateMessage({
							error: error.description
						});
						
					}
				});		
			},
			error: function(collection, error, options) {
				updateMessage({
					error: error.description
				});
				
			}
		});
	
		this.$el.html(this.template());
		return this;
	},
	generateGraphData: function () {
		// Generating data for graph plotting
		// TODO : more efficient way
			/*
			var this.jsonResult = [{
				date: '',
				expense: ,
				income: ,
				total: 
			}];
			
			item = {
				amount: ,
				date: '',
				details: '',
				org: '',
				tag: '',
				type: '',	
				user: ''	//will be same, no worries
			}
			*/		
		var that = this;
		this.expenseCollection.each(function(item) {
			//loop through this.jsonResult to find if data of that date already exists
			//if yes add the amount to the expense
			//if not, add a json doc of that date

			var flag = false;
			for(var i=0; i<that.jsonResult.length; i++)
			{
				var current = new Date(item.get('date'));
				if(that.jsonResult[i].date.getTime() == current.getTime())
				{
					that.jsonResult[i].expense -= item.get('amount');
					flag = true;
					break;
				}
			} 
			if(!flag)
			{
				that.jsonResult.push({
					date: new Date(item.get('date')),
					expense: - item.get('amount'),
					income: 0,
					total: 0
				});
			}
		});
		
		//same for income
		this.incomeCollection.each(function(item) {
			var flag = false;
			for(var i=0; i<that.jsonResult.length; i++)
			{
				var current = new Date(item.get('date'));
				if(that.jsonResult[i].date.getTime() == current.getTime())
				{
					that.jsonResult[i].income += item.get('amount');
					flag = true;
					break;
				}
			} 
			if(!flag)
			{
				that.jsonResult.push({
					date: new Date(item.get('date')),
					expense: 0,
					income: item.get('amount'),
					total: 0
				});
			}
		});

		for(var i=0; i<this.jsonResult.length; i++)
		{
			this.jsonResult[i].total = this.jsonResult[i].income + this.jsonResult[i].expense;
		}
		
		
	},
	renderChart: function() {
		var chart;
		var that = this;
		setTimeout(function () {
			chart = c3.generate({
				bindto: '#chart-complete',
				data: {
					json: that.jsonResult,
					keys: {
						x: 'date',
						value: ['expense', 'income', 'total']
					},
					groups: [['expense','income']],
					type: 'bar',
					types: {
						total: 'spline'
					}
				},
				axis: {
					x: {
						type:'timeseries',
						tick: {
							fit: true,
							format: '%e-%b-%y',
							rotate:55
						}
					}
				},
				bar: {
					width: {
						ratio: 0.2
					},
					spacing: 2
				}
			});

		}, 1000);
		
	},
	updateChart: function() {
		// this function is called to update the view
		// of chart using flow not to reload the whole data
		// the initial data is already in this.jsonResult
		// we only need the data of today as added element will be of today

		// first fetch the debit/expense data
		var query = new Kinvey.Query();
		query.equalTo('user', App.user.get('username'))
				.and()
				.equalTo('type','debit')
				.and()
				.greaterThanOrEqualTo('date', getStringDate(-1))
				.descending('date');

		var that = this;
		this.expenseCollection.fetch({

			query: query,
			success: function(collection, response, options) {
				
				var query = new Kinvey.Query();
				query.equalTo('user',App.user.get('username'))
						.and()
						.equalTo('type','credit')
						.and()
						.greaterThanOrEqualTo('date', getStringDate(-1))
						.descending('date');
				
				var _that = that;
				that.incomeCollection.fetch({
					query: query,
					success: function(collection, response, options) {
						//this has to be broken down
						_that.generateGraphData();
						_that.renderChart();		
					},
					error: function(collection, error, options) {
						updateMessage({
							error: error.description
						});
						
					}
				});		
			},
			error: function(collection, error, options) {
				updateMessage({
					error: error.description
				});
				
			}
		});
	
	}
});

var homeView = new App.HomeView();
var signupView = new App.SignupView();
var loginView = new App.LoginView();
var dashboardView = new App.DashboardView();

// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
// |||||||||||||||||||||||||||||||||| Routers |||||||||||||||||||||||||||||||||||||||||||||||||||||
// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
App.AppRouter = Backbone.Router.extend({
	routes: {
		'': 'home',
		'login': 'login',
		'getstarted': 'signup',
		'logout': 'logout',
		'dashboard': 'dashboard'
	},
	home: function() {

		homeView.render();

		if(App.errorMsg !== "") {
			alert(App.errorMsg);
		}
		// clear error messages
		App.errorMsg = ""; 
	},
	signup: function() {
		if(App.user.isLoggedIn()) {
			App.errorMsg += "User already Logged In";
			App.router.navigate('', {trigger: true});
		}
		else {
			signupView.render();

			if(App.errorMsg !== "") {
				alert(App.errorMsg);
			}
			// clear error messages
			App.errorMsg = ""; 
		}

	},
	login: function() {
		if(App.user.isLoggedIn()) {
			App.errorMsg += "User already Logged In";
			//TODO : navigate to dashboard insted of home
			App.router.navigate("dashboard", {trigger: true});
		}
		else {
			loginView.render();

			if(App.errorMsg !== "") {
				alert(App.errorMsg);
			}
			// clear error messages
			App.errorMsg = ""; 
		}
	},
	logout: function() {
		var user = Kinvey.Backbone.getActiveUser();
		if(null !== user) {
			user.logout({
				success: function(model, response, options) {
					App.errorMsg += response.fname + " ! you are successfully logged out!";
					//temporary solution
					//problem : when user logout, then also some variables are set as the state
					// of the script remains same. So when other user log in, the previous values
					// from previous users like chart might show.
					// this is a temp solution to reload so as to init everything again
					// problem with this approach : chrome asking for saving password after signing out
					App.router.navigate('');
					location.reload(true);
				},
				error: function(model, error, options) {
					App.errorMsg += "Error while logging out" + error.description;
					App.router.navigate('', {trigger: true});
				}
			});
		}
		else {
			App.router.navigate('', {trigger: true});
		}
	},
	dashboard: function() {
		if(App.user.isLoggedIn()) {
			dashboardView.render();
				
			if(App.errorMsg !== "") {
				alert(App.errorMsg);
			}
			// clear error messages
			App.errorMsg = ""; 
		}
		else {
			App.errorMsg += "Invalid Access. You are not logged in. Login and try again.";
			App.router.navigate('login', {trigger: true});
		}
	}
});

