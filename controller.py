import pymongo
import time
import math
from math import radians, cos, sin, asin, sqrt

def haversine(lon1, lat1, lon2, lat2):
    # Convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 * 1000 # Radius of earth in kilometers * 1000 for meters. Use 3956 for miles
    return c * r

def midpoint(lon1, lat1, lon2, lat2):

    # Convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    bx = math.cos(lat2) * math.cos(lon2 - lon1)
    by = math.cos(lat2) * math.sin(lon2 - lon1)
    lat3 = math.atan2(math.sin(lat1) + math.sin(lat2), \
           math.sqrt((math.cos(lat1) + bx) * (math.cos(lat1) \
           + bx) + by**2))
    lon3 = lon1 + math.atan2(by, math.cos(lat1) + bx)

    return [round(math.degrees(lat3), 7), round(math.degrees(lon3), 7)]

# Connect to mongodb
client = pymongo.MongoClient("127.0.0.1", 3001) 

# Find "Nodes" collection within "Meteor" database
db = client.meteor
nodes = db.nodes

# XBee comfortable range based off of experimentation
xbeeRange = 120

while True:

	# Read nodes
	clat = nodes.find_one({"node": "Coordinator"})['latitude']
	clon = nodes.find_one({"node": "Coordinator"})['longitude']
	# print clat + ',' + clon
	elat = nodes.find_one({"node": "End Device"})['latitude']
	elon = nodes.find_one({"node": "End Device"})['longitude']
	# print elat + ',' + elon
	qalt = nodes.find_one({"node": "Quadcopter"})['altitude']
	# print qalt

	# Calculate distance
	distance = haversine(float(clon), float(clat), float(elon), float(elat))
	# print distance

	# If distance exceeds the XBee range, give a destination to the quadcopter
	if distance > xbeeRange:
		#print "Create Quad Destination"

		# Calculate midpoint between End Device and Coordinator
		latlong = midpoint(float(clon), float(clat), float(elon), float(elat))
		destLat = str(latlong[0])
		destLon = str(latlong[1])
		destAlt = str(20.00 + float(qalt))

		# Check to make sure destination is still within coverage region
		quadDist = haversine(float(clon), float(clat), float(destLon), float(destLat))
		if quadDist > 120:
			#print "End Device is too far away for Quadcopter to recover"
			# Reset the Destination node
			nodes.update_one({"node": "Destination"},
    			{"$set": {"latitude": "Out of Range", "longitude": "Out of Range", "altitude": "Out of Range"}}
			)			

		if quadDist < 120:
			# Update Destination
			nodes.update_one({"node": "Destination"},
    			{"$set": {"latitude": destLat, "longitude": destLon, "altitude": destAlt}}
			)

	if distance < xbeeRange:
		#print "End Device in Coverage Region"

		# Reset the Destination node
		nodes.update_one({"node": "Destination"},
    		{"$set": {"latitude": "N/A", "longitude": "N/A", "altitude": "N/A"}}
		)

	time.sleep(1.0)

