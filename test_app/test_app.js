// Would otherwise be in the lib folder:
Nodes = new Mongo.Collection("nodes");

// Code shared between client and server
TabularTables = {};

Meteor.isClient && Template.registerHelper('TabularTables', TabularTables);

TabularTables.Nodes = new Tabular.Table({
  name: "NodeList",
  collection: Nodes,
  columns: [
    {data: "node", title: "Node"},
    {data: "latitude", title: "Latitude"},
    {data: "longitude", title: "Longitude"}
  ]
});


// Client only code
if (Meteor.isClient) {

	Template.AddNode.events({
    	'submit form': function(event){
      		event.preventDefault();
      		var nodeVar = event.target.node.value;
      		var latitudeVar = event.target.latitude.value;
      		var longitudeVar = event.target.longitude.value;
      		Nodes.insert({
        	  node: nodeVar,
        	  latitude: latitudeVar,
        	  longitude: longitudeVar
      		});
    	}
  	});

	Template.RemoveNode.events({
		'submit form': function(event){
			event.preventDefault();
			var nodeVar = event.target.node.value;
			var selectedNode = Nodes.find({node: nodeVar}).fetch()[0]._id;
      		Nodes.remove(selectedNode);
    	}
	})

	Template.UpdateNode.events({
		'submit form': function(event){
			event.preventDefault();
			var nodeVar = event.target.node.value;
			var latitudeVar = event.target.latitude.value;
      var longitudeVar = event.target.longitude.value;
			var selectedNode = Nodes.find({node: nodeVar}).fetch()[0]._id;
      Nodes.update(selectedNode, {$set: {latitude: latitudeVar, longitude: longitudeVar} });
    	}
	})
}


// Server only code
if (Meteor.isServer && Nodes.find().count() === 0) {

  var nodes = [
    {node: "Quadcopter", latitude: "38.8792", longitude: "-76.3409"},
    {node: "Coordinator", latitude: "38.8788", longitude: "-76.3419"},
    {node: "End Device", latitude: "38.8721", longitude: "-76.3468"},
    {node: "Router A", latitude: "38.8735", longitude: "-76.3465"},
    {node: "Router B", latitude: "38.8700", longitude: "-76.3432"}
  ]
  _.each(nodes, function (node) {
    Nodes.insert(node);
  })

}

if (Meteor.isServer) {

  exec = Npm.require('child_process').exec;

  Meteor.startup(function() {
    return Meteor.methods({
      removeAllNodes: function() {
        return Nodes.remove({});
      },

      sendLogMessage: function() {
        console.log("Hello world");
      },

      consoleExecSync : function(seq) {
        var cmd = "python ~/workspace/meteor/table/output.py";
        exec(cmd, Meteor.bindEnvironment(

          function(error, stdout, stderr) {
            if (error) {
              throw new Meteor.Error(error, error);
            }
            if (stdout) {
              console.log(stdout);

              //take CSV output of python code and parse. format: {latitude,longitude}
              var output = stdout.trim().split(',');
              var latitudeIndex = 0;
              var longitudeIndex = 1;
              //console.log(output[latitudeIndex] + "," + output[longitudeIndex]);

              //take output of python code and use it to update quadcopter node:
              var latitudeVar = output[latitudeIndex];
              var longitudeVar = output[longitudeIndex];
              var selectedNode = Nodes.find({node: "Quadcopter"}).fetch()[0]._id;
              Nodes.update(selectedNode, {$set: {latitude: latitudeVar, longitude: longitudeVar} });

            }
            if (stderr) {
              console.log(stderr);
            }
          }

        ));
      }

    });

  });
}