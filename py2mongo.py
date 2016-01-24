import pymongo
import random
import time

# Connect to mongodb
client = pymongo.MongoClient("127.0.0.1", 3001) 

# Find "Nodes" collection within "Meteor" database
db = client.meteor
nodes = db.nodes

while True:
	latitude = random.uniform(39.6360000,39.6380000)
	longitude = random.uniform(-76.5400000,-76.5420000)
	altitude = random.uniform(-0.1000000, 0.1000000)

	# Update Node
	nodes.update_one({"node": "Router Python"},
    	{"$set": {"latitude": latitude, "longitude": longitude, "altitude": altitude}}
	)

	"""
	# Read Node
	corLat = nodes.find_one({"node": "Coordinator"})['latitude']
	corLon = nodes.find_one({"node": "Coordinator"})['longitude']
	print corLat + ',' + corLon

	endLat = nodes.find_one({"node": "End Device"})['latitude']
	endLon = nodes.find_one({"node": "End Device"})['longitude']
	print endLat + ',' + endLon
	"""

	time.sleep(2.0)