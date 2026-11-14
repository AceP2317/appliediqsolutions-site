// SAMPLE DATA. These 24 purchase orders are invented to exercise the model. They are not
// from any supplier, carrier or business. Replace them with your own history in the page.
var LEAD_TIME_SAMPLE_CSV = [
  'origin,carrier,peak,distance_nm,lead_days',
  'Port A,Carrier X,0,7800,34',
  'Port A,Carrier X,1,7800,41',
  'Port A,Carrier Y,0,8000,38',
  'Port A,Carrier Y,1,8000,45',
  'Port A,Carrier Z,0,7900,33',
  'Port A,Carrier Z,1,7900,40',
  'Port A,Carrier X,0,8100,35',
  'Port A,Carrier Y,0,7950,39',
  'Port B,Carrier X,0,3400,15',
  'Port B,Carrier X,1,3400,20',
  'Port B,Carrier Y,0,3600,18',
  'Port B,Carrier Y,1,3600,24',
  'Port B,Carrier Z,0,3500,14',
  'Port B,Carrier Z,1,3500,19',
  'Port B,Carrier X,0,3700,16',
  'Port B,Carrier Y,0,3450,17',
  'Port C,Carrier X,0,1200,7',
  'Port C,Carrier X,1,1200,10',
  'Port C,Carrier Y,0,1400,9',
  'Port C,Carrier Y,1,1400,13',
  'Port C,Carrier Z,0,1300,6',
  'Port C,Carrier Z,1,1300,9',
  'Port C,Carrier X,0,1500,8',
  'Port C,Carrier Y,0,1250,8'
].join('\n');
