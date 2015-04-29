// Application namespace
var App = {};

Kinvey.init({
	appKey: 'kid_-JNL0sgZyl',
	appSecret: '89f8ac1f88a34210898ab2540ec71513'
})
.then(function(activeUser) {
	
	console.log("Kinvey Connection Success");

	var promise = Kinvey.ping();
	promise.then(function(response) {
		console.log("Kinvey Ping Success : response version : " + response.version + " response: " + response.kinvey);
	}, function(error) {
		console.log("Kinvey Ping failure : Error : " + error.description);
	});

}, function(error) {
	console.log("Kinvey Connection Failure : Error : " + error.description);
	alert("Kinvey Connection Failure, cannot proceed");
});