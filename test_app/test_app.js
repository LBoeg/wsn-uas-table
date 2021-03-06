// Would otherwise be in the lib folder (maybe?):
Nodes = new Mongo.Collection("nodes");

// Code shared between client and server
TabularTables = {};

Meteor.isClient && Template.registerHelper('TabularTables', TabularTables);


TabularTables.Drones = new Tabular.Table({
  name: "DroneList",
  collection: Nodes,
  columns: [
    {data: "node", title: "Drone"},
    {data: "armed", title: "Armed"},  
    {data: "flightMode", title: "FlightMode"},  
    {data: "battery", title: "Battery"},
    {data: "altitude", title: "Altitude"},
    //{data: "heading", title: "Heading"},
    {data: "groundSpeed", title: "GroundSpeed"},
    {data: "verticalSpeed", title: "VerticalSpeed"},
    //{data: "roll", title: "Roll"},
    //{data: "yaw", title: "Yaw"},
    //{data: "pitch", title: "Pitch"},
  ]
});


TabularTables.Nodes = new Tabular.Table({
  name: "NodeList",
  collection: Nodes,
  columns: [
    {data: "node", title: "Node"},
    {data: "latitude", title: "Latitude"},
    {data: "longitude", title: "Longitude"},
    {data: "altitude", title: "Altitude"}
  ]
});

// Client only code
if (Meteor.isClient) {

  Template.Drones.helpers({
    selector: function () {
      return {type: "Drone"};
    }
  });

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

  Template.FlightData.helpers({
    'flightMode': function() {
      flightMode = String(Nodes.findOne({node: "Quadcopter"}).flightMode);
      return flightMode
    },
    'battery': function() {
      battery = String(Nodes.findOne({node: "Quadcopter"}).battery);
      return battery
    },
    'altitude': function() {
      altitude = String(Nodes.findOne({node: "Quadcopter"}).altitude);
      return altitude
    },
    'armed': function() {
      armed = String(Nodes.findOne({node: "Quadcopter"}).armed);
      return armed
    },
    'groundSpeed': function() {
      groundSpeed = String(Nodes.findOne({node: "Quadcopter"}).groundSpeed);
      return groundSpeed
    },
    'verticalSpeed': function() {
      verticalSpeed = String(Nodes.findOne({node: "Quadcopter"}).verticalSpeed);
      return verticalSpeed
    },
    'roll': function() {
      roll = String(Nodes.findOne({node: "Quadcopter"}).roll);
      return roll
    },
    'pitch': function() {
      pitch = String(Nodes.findOne({node: "Quadcopter"}).pitch);
      return pitch
    },
    'yaw': function() {
      yaw = String(Nodes.findOne({node: "Quadcopter"}).yaw);
      return yaw
    },
    'heading': function() {
      heading = String(Nodes.findOne({node: "Quadcopter"}).heading);
      return heading
    }
  });

	Template.AddNode.events({
    	'submit form': function(event){
      		event.preventDefault();
      		var nodeVar = event.target.node.value;
      		var latitudeVar = event.target.latitude.value;
      		var longitudeVar = event.target.longitude.value;
          var altitudeVar = event.target.altitude.value;
      		Nodes.insert({
        	  node: nodeVar,
        	  latitude: latitudeVar,
        	  longitude: longitudeVar,
            altitude: altitudeVar
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
      var altitudeVar = event.target.altitude.value;
			var selectedNode = Nodes.find({node: nodeVar}).fetch()[0]._id;
      Nodes.update(selectedNode, {$set: {latitude: latitudeVar, longitude: longitudeVar, altitude: altitudeVar} });
    	}
	})

  Meteor.startup(function() {
    $(window).resize(function() {
      $('#map').css('height', window.innerHeight - 82 - 250); //Originally: 82 - 45; 82 - 20 for full screen on laptop
    });
    $(window).resize(); // trigger resize event
  });

  (function() {
    // save these original methods before they are overwritten
    var proto_initIcon = L.Marker.prototype._initIcon;
    var proto_setPos = L.Marker.prototype._setPos;

    var oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

    L.Marker.addInitHook(function () {
        this.options.rotationOrigin = this.options.rotationOrigin || 'center bottom' ;
        this.options.rotationAngle = this.options.rotationAngle || 0;
    });

    L.Marker.include({
        _initIcon: function() {
            proto_initIcon.call(this);
        },

        _setPos: function (pos) {
            proto_setPos.call(this, pos);

            if(this.options.rotationAngle) {
                this._icon.style[L.DomUtil.TRANSFORM+'Origin'] = this.options.rotationOrigin;

                if(oldIE) {
                    // for IE 9, use the 2D rotation
                    this._icon.style[L.DomUtil.TRANSFORM] = ' rotate(' + this.options.rotationAngle + 'deg)';
                } else {
                    // for modern browsers, prefer the 3D accelerated version
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
                }
            }
        },

        setRotationAngle: function(angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },

        setRotationOrigin: function(origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
  })();

  // Load all the custom icons
  var quadIcon = L.icon({iconUrl: 'copter.png', iconSize: [65, 65]});
  var endIcon = L.icon({iconUrl: 'Letter-E-red-icon.png', iconSize: [24, 24]});
  var routIcon = L.icon({iconUrl: 'Letter-R-grey-icon.png', iconSize: [24, 24]});
  var corIcon = L.icon({iconUrl: 'Letter-C-blue-icon.png', iconSize: [24, 24]});
  var destIcon = L.icon({iconUrl: 'dest-icon.png', iconSize: [24, 24]});
  var pyRoutIcon = L.icon({iconUrl: 'Python-icon.png', iconSize: [24, 24]});
  var waypointIcon = L.icon({iconUrl: 'waypoint-icon.png', iconSize: [24, 24]});

  Template.map.rendered = function() {
    L.Icon.Default.imagePath = 'packages/bevanhunt_leaflet/images';

    var map = L.map('map', {
      doubleClickZoom: false,
      scrollWheelZoom: false
    }).setView([39.6373470, -76.5402335], 18);

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
        L.marker([Nodes.findOne({node: "Quadcopter"}).latitude, Nodes.findOne({node: "Quadcopter"}).longitude], {icon: quadIcon, zIndexOffset: 100, rotationAngle: Nodes.findOne({node: "Quadcopter"}).heading, rotationOrigin: "center"}).addTo(markers);
        L.marker([Nodes.findOne({node: "End Device"}).latitude, Nodes.findOne({node: "End Device"}).longitude], {icon: endIcon}).addTo(markers);
        L.marker([Nodes.findOne({node: "Coordinator"}).latitude, Nodes.findOne({node: "Coordinator"}).longitude], {icon: corIcon}).addTo(markers);
        L.circle([Nodes.findOne({node: "Coordinator"}).latitude, Nodes.findOne({node: "Coordinator"}).longitude], 70).addTo(markers);
        if(Nodes.findOne({node: "Destination"}).latitude != "N/A" && Nodes.findOne({node: "Destination"}).latitude != "Out of Range") {
          L.marker([Nodes.findOne({node: "Destination"}).latitude, Nodes.findOne({node: "Destination"}).longitude], {icon: destIcon, zIndexOffset: 90}).addTo(markers);
          //var pointA = new L.LatLng(Nodes.findOne({node: "Destination"}).latitude, Nodes.findOne({node: "Destination"}).longitude);
          //var pointB = new L.LatLng(Nodes.findOne({node: "Quadcopter"}).latitude, Nodes.findOne({node: "Quadcopter"}).longitude);
          //var path = [pointA, pointB];
          //var line = L.polyline(path, {color: 'red', opacity: 0.3}).addTo(markers);
        }
        if(Nodes.findOne({node: "Waypoint"}).latitude != "N/A") {
          L.marker([Nodes.findOne({node: "Waypoint"}).latitude, Nodes.findOne({node: "Waypoint"}).longitude], {icon: waypointIcon, zIndexOffset: 95}).addTo(markers);
          var pointA = new L.LatLng(Nodes.findOne({node: "Waypoint"}).latitude, Nodes.findOne({node: "Waypoint"}).longitude);
          var pointB = new L.LatLng(Nodes.findOne({node: "Quadcopter"}).latitude, Nodes.findOne({node: "Quadcopter"}).longitude);
          var path = [pointA, pointB];
          var line = L.polyline(path, {color: 'red', opacity: 0.3}).addTo(markers);
        }
        //L.marker([Nodes.findOne({node: "Router Python"}).latitude, Nodes.findOne({node: "Router Python"}).longitude], {icon: pyRoutIcon}).addTo(markers);
        //Center on Quadcopter:
        //map.setView([Nodes.findOne({node: "Quadcopter"}).latitude, Nodes.findOne({node: "Quadcopter"}).longitude]);
        //Center on Coordinator:
        map.setView([Nodes.findOne({node: "Coordinator"}).latitude, Nodes.findOne({node: "Coordinator"}).longitude]);
      });
      markers.addTo(map);
    });

  };

}


// Server only code
if (Meteor.isServer && Nodes.find().count() === 0) {

  var nodes = [
    {node: "Quadcopter", type: "Drone", latitude: "38.8792", longitude: "-76.3409", altitude: "0.0", flightMode: "GUIDED", battery: "11.4V"},
    {node: "Coordinator", type: "WSN", latitude: "38.8788", longitude: "-76.3419", altitude: "0.0"},
    {node: "End Device", type: "WSN", latitude: "38.8721", longitude: "-76.3468", altitude: "0.0"},
    {node: "Router A", type: "WSN", latitude: "38.8735", longitude: "-76.3465", altitude: "0.0"},
    {node: "Destination", type: "Nav", latitude: "N/A", longitude: "N/A", altitude: "N/A"},
    {node: "Waypoint", type: "Nav", latitude: "N/A", longitude: "N/A", altitude: "N/A"}
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