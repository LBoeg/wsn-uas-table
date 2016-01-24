import serial
import pymongo
import time
from math import radians, cos, sin, asin, sqrt

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 * 1000 # Radius of earth in kilometers. Use 3956 for miles
    return c * r

# Connect to mongodb
client = pymongo.MongoClient("127.0.0.1", 3001) 

# Find "Nodes" collection within "Meteor" database
db = client.meteor
nodes = db.nodes

# Openign serial connection
ser = serial.Serial('/dev/cu.usbmodem1411', 9600)
#ser = serial.Serial('/dev/cu.usbmodem1421', 9600)

# Make sure the Coordinator and End Device have been found before calculating distance
cor = 0
end = 0

# Initial distance as zero so no action is taken prematurely
distance = 0

# XBee range "danger zone" based off of experimentation
xbeeDanger = 120

# Reading from Arduino
while True:
	line = ser.readline()
	words = line.split(',')
	node = words[0]
	lat = words[1]
	lon = words[2]
	
	if node == 'Coordinator':
		clat = float(lat)
		clon = float(lon)
		cor = 1

	if node == 'End Device':
		elat = float(lat)
		elon = float(lon)
		end = 1

	# Update Node based off of reading
	nodes.update_one({"node": node},
    	{"$set": {"latitude": lat, "longitude": lon}}
	)

	# Calculate distance from Coordinator to End Device
	if cor == 1 and end == 1:
		distance = haversine(clon, clat, elon, elat)
		print distance

	"""
	# If the distance exceeds the XBee limit, write the mission file and then write the fly-no-fly file
	if distance > xbeeDanger:
		# Mission script
		mission = open('mpmission.txt','w')
		mission.truncate()
		mission.write('QGC WPL 110')
		# TODO: write mission
		
		Example mpmission.txt:

		QGC WPL 110
		0       1       3       16      0       5       0       0       39.6372159064645899     -76.5402594208717346    20      1
		1       0       3       16      0       5       0       0       39.6369432511348805     -76.5400984883308411    20      1
		2       0       3       16      0       5       0       0       39.6368234476955763     -76.5403801202774048    20      1
		3       0       3       16      0       5       0       0       39.6369308576852646     -76.5406349301338196    20      1
		4       0       3       16      0       5       0       0       39.6371642672800988     -76.5406563878059387    20      1
		5       0       3       16      0       5       0       0       39.6372097097644911     -76.5404552221298218    20      1
		6       0       3       16      0       5       0       0       39.6369432511348805     -76.5400984883308411    20      1
		7       0       3       16      0       5       0       0       39.6369308576852646     -76.5406349301338196    20      1

	"""

# Writing to Arduino
# ser.write('5')
