import pymongo
import random
import time

# Connect to mongodb
client = pymongo.MongoClient("127.0.0.1", 3001) 

# Find "Nodes" collection within "Meteor" database
db = client.meteor
nodes = db.nodes

while True:
	latitude = random.uniform(38.0,40.3)
	longitude = random.uniform(-77.0,-75.5)

	# Update Node
	nodes.update_one({"node": "Router Python"},
    	{"$set": {"latitude": latitude, "longitude": longitude}}
	)

	time.sleep(2.0)