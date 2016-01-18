long lat, lon, nodeSel;
String node = "Coordinator";

void setup() {
  Serial.begin(9600);
}

void loop() {
  lat = random(35.0000, 40.0000);
  lon = random(-80.0000,-70.0000);

  nodeSel = random(0,3);
  
  if(nodeSel == 0) {
    node = "Coordinator";
  }
  else if(nodeSel == 1) {
    node = "End Device";
  }
  else if(nodeSel == 2) {
    node = "Router A";
  }

  Serial.print(node);
  Serial.print(",");
  Serial.print(lat);
  Serial.print(",");
  Serial.print(lon);
  Serial.println("");

  delay(1000);
}
