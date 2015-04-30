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
					App.router.navigate('', {trigger: true});
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
				App.router.navigate('', {trigger: true});
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
		this.$el.html(this.template());
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
		this.newExpenseView = new App.NewExpenseView();
		this.newIncomeView = new App.NewIncomeView();
	},
	render: function() {
		this.$el.html(this.template());
		$(".content").append(this.newExpenseView.render().el);
		$(".content").append(this.newIncomeView.render().el);
	}
});

App.NewExpenseView = Backbone.View.extend({
	tagName: "div",
	template: _.template($("#newexpenseview-template").html()),
	render: function() {
		this.$el.html(this.template());
		return this;
	}

});

App.NewIncomeView = Backbone.View.extend({
	tagName: "div",
	template: _.template($("#newincomeview-template").html()),
	render: function() {
		this.$el.html(this.template());
		return this;
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
		if(App.errorMsg !== "") {
			alert(App.errorMsg);
		}

		homeView.render();
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
		}
	},
	login: function() {
		if(App.user.isLoggedIn()) {
			App.errorMsg += "User already Logged In";
			//TODO : navigate to dashboard insted of home
			App.router.navigate('', {trigger: true});
		}
		else {
			loginView.render();
		}
	},
	logout: function() {
		var user = Kinvey.Backbone.getActiveUser();
		if(null !== user) {
			user.logout({
				success: function(model, response, options) {
					App.errorMsg += response.fname + " ! you are successfully logged out!";
					App.router.navigate('', {trigger: true});
				},
				error: function(model, error, options) {
					App.errorMsg += "Error while logging out" + error.description;
					App.router.navigate('', {trigger: true});
				}
			});
		}
		else {
			App.errorMsg += "No User Logged In";
			App.router.navigate('', {trigger: true});
		}
	},
	dashboard: function() {
		if(App.user.isLoggedIn()) {
			dashboardView.render();
		}
		else {
			App.errorMsg += "Invalid Access. You are not logged in. Login and try again.";
			App.router.navigate('login', {trigger: true});
		}
	}
});

