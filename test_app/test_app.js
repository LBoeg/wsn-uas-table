// Would otherwise be in the lib folder (maybe?):
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

  Template.Distance.helpers({
    'dist': function() {
      //Haversine distance JS code
      Number.prototype.toRad = function() {
        return this * Math.PI / 180;
      }

      var end = Nodes.findOne({node: "End Device"});
      var cor = Nodes.findOne({node: "Coordinator"});

      var lat2Str = end && end.latitude;
      var lon2Str = end && end.longitude;
      var lat1Str = cor && cor.latitude;
      var lon1Str = cor && cor.longitude;

      var lat2 = parseFloat(lat2Str);
      var lon2 = parseFloat(lon2Str);
      var lat1 = parseFloat(lat1Str);
      var lon1 = parseFloat(lon1Str);

      var R = 6371; // km 
      var x1 = lat2-lat1;
      var dLat = x1.toRad();  
      var x2 = lon2-lon1;
      var dLon = x2.toRad();  
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                      Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
                      Math.sin(dLon/2) * Math.sin(dLon/2);  
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;

      var strUnits = " km";

      if (d < 1) {
        d = d * 1000;
        var strUnits = " meters";
      }
      
      var stringD = d.toString();
      var distance = stringD.concat(strUnits);

      return distance
    }

  });

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

  Meteor.startup(function() {
    $(window).resize(function() {
      $('#map').css('height', window.innerHeight - 82 - 20); //Originally: 82 - 45
    });
    $(window).resize(); // trigger resize event
  });

  var quadIcon = L.icon({
    iconUrl: 'quadcopter.png',
    iconSize: [38, 38],
  });

  var endIcon = L.icon({
    iconUrl: 'Letter-E-red-icon.png',
    iconSize: [24, 24],
  });
  
  var routIcon = L.icon({
    iconUrl: 'Letter-R-grey-icon.png',
    iconSize: [24, 24],
  });

  var corIcon = L.icon({
    iconUrl: 'Letter-C-blue-icon.png',
    iconSize: [24, 24],
  });

  Template.map.rendered = function() {
    L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

    var map = L.map('map', {
      doubleClickZoom: false,
      scrollWheelZoom: false
    }).setView([38.9875, -76.9373], 18);

    //L.tileLayer.provider('Thunderforest.Outdoors').addTo(map);

    googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    }).addTo(map);

    var markers = new L.LayerGroup().addTo(map);

    // Move quadcopter icon based off of quadcopter lat and long
    this.autorun(function(){
      var cursor = Nodes.find({node: "Quadcopter"});
      markers.clearLayers();
      cursor.forEach(function(foo){
        L.marker([Nodes.findOne({node: "Coordinator"}).latitude, Nodes.findOne({node: "Coordinator"}).longitude], {icon: corIcon}).addTo(markers);
        L.circle([Nodes.findOne({node: "Coordinator"}).latitude, Nodes.findOne({node: "Coordinator"}).longitude], 120).addTo(markers);
        L.marker([Nodes.findOne({node: "Quadcopter"}).latitude, Nodes.findOne({node: "Quadcopter"}).longitude], {icon: quadIcon}).addTo(markers);
        L.marker([Nodes.findOne({node: "End Device"}).latitude, Nodes.findOne({node: "End Device"}).longitude], {icon: endIcon}).addTo(markers);
        //Center on Quadcopter:
        map.setView([Nodes.findOne({node: "Quadcopter"}).latitude, Nodes.findOne({node: "Quadcopter"}).longitude]);
        //Center on Coordinator:
        //map.setView([Nodes.findOne({node: "Coordinator"}).latitude, Nodes.findOne({node: "Coordinator"}).longitude]);
      });
      markers.addTo(map);
    });

  };

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

      /*removeAllMarkers: function() {
        return Markers.remove({});
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
      */

    });

  });
}