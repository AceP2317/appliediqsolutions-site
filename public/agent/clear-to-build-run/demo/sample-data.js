// SAMPLE DATA. An invented plant that assembles three control-panel products from eight parts.
// Every order, part number, quantity and date is made up for this demo. There are no prices.
// Plain script, no build. Loaded by index.html in a browser and by test.mjs in node.
var CLEAR_TO_BUILD_SAMPLE = {
  label: 'SAMPLE DATA',
  today: '2026-11-23',
  orders: [
    'order,item,qty,due',
    'SO-5101,CP-100,30,2026-11-20',
    'SO-5102,CP-200,10,2026-11-24',
    'SO-5103,CP-300,25,2026-11-25',
    'SO-5104,CP-100,40,2026-11-27',
    'SO-5105,CP-200,15,2026-12-01',
    'SO-5106,CP-300,30,2026-12-08',
    'SO-5107,CP-100,50,2026-12-04',
    'SO-5108,CP-200,20,2026-12-08',
    'SO-5109,CP-300,20,2026-12-09',
    'SO-5110,CP-200,30,2026-12-15',
    'SO-5111,CP-100,40,2026-12-16',
    'SO-5112,CP-200,25,2026-12-22'
  ].join('\n'),
  bom: [
    'item,component,qty_per',
    'CP-100,PCB-A,1',
    'CP-100,MCU-7,1',
    'CP-100,ENC-S,1',
    'CP-100,CON-12,2',
    'CP-200,PCB-B,1',
    'CP-200,MCU-7,2',
    'CP-200,ENC-L,1',
    'CP-200,CON-12,4',
    'CP-200,PSU-24,1',
    'CP-300,PCB-A,1',
    'CP-300,RLY-5,4',
    'CP-300,ENC-S,1',
    'CP-300,CON-12,2'
  ].join('\n'),
  stock: [
    'part,on_hand',
    'PCB-A,120',
    'PCB-B,40',
    'MCU-7,60',
    'ENC-S,300',
    'ENC-L,30',
    'CON-12,1000',
    'PSU-24,10',
    'RLY-5,80'
  ].join('\n'),
  inbound: [
    'part,qty,date',
    'PCB-B,40,2026-11-18',
    'RLY-5,200,2026-11-30',
    'PSU-24,20,2026-12-01',
    'MCU-7,100,2026-12-04',
    'PCB-A,100,2026-12-07',
    'ENC-L,20,2026-12-08',
    'PSU-24,40,2026-12-14',
    'MCU-7,100,2026-12-18'
  ].join('\n')
};
