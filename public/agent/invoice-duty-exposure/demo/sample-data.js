// SAMPLE DATA. Every description, invoice line, value and rate below is invented for this demo.
// The chapter numbers are real two-digit Harmonized System chapters, used only as labels.
// The rates are NOT HTS duty rates and must not be used for any real entry.
var SAMPLE_TRAINING = [
  { text: 'knitted cotton t-shirt', chapter: 61 },
  { text: "women's knit sweater acrylic", chapter: 61 },
  { text: 'knit polo shirt cotton', chapter: 61 },
  { text: 'crew neck knit pullover wool', chapter: 61 },
  { text: 'knitted cotton socks', chapter: 61 },
  { text: 'jersey knit tank top', chapter: 61 },
  { text: 'woven cotton dress shirt', chapter: 62 },
  { text: 'woven trousers polyester', chapter: 62 },
  { text: "men's woven jacket nylon", chapter: 62 },
  { text: 'woven denim jeans cotton', chapter: 62 },
  { text: 'woven linen skirt', chapter: 62 },
  { text: 'woven windbreaker polyester', chapter: 62 },
  { text: 'steel bracket stamped', chapter: 73 },
  { text: 'iron pipe fitting threaded', chapter: 73 },
  { text: 'steel fastener bolt hex', chapter: 73 },
  { text: 'stainless steel tube', chapter: 73 },
  { text: 'cast iron manhole cover', chapter: 73 },
  { text: 'steel wire spring', chapter: 73 },
  { text: 'centrifugal pump housing', chapter: 84 },
  { text: 'hydraulic valve assembly', chapter: 84 },
  { text: 'industrial compressor unit', chapter: 84 },
  { text: 'gear reducer machinery', chapter: 84 },
  { text: 'conveyor roller bearing', chapter: 84 },
  { text: 'engine cooling fan machine', chapter: 84 },
  { text: 'printed circuit board assembly', chapter: 85 },
  { text: 'electric motor controller', chapter: 85 },
  { text: 'copper wire cable electrical', chapter: 85 },
  { text: 'led power supply module', chapter: 85 },
  { text: 'switch relay electrical', chapter: 85 },
  { text: 'battery charger electrical', chapter: 85 },
  { text: 'polyethylene resin pellets', chapter: 39 },
  { text: 'plastic injection molded housing', chapter: 39 },
  { text: 'pvc pipe fitting', chapter: 39 },
  { text: 'polypropylene film sheet', chapter: 39 },
  { text: 'acrylic plastic sheet', chapter: 39 },
  { text: 'plastic storage container', chapter: 39 }
];

// Sample invoice, in the CSV layout the page reads: description,value_usd,origin
var SAMPLE_INVOICE = [
  'description,value_usd,origin',
  'stainless steel fastener set,1200,China',
  'knitted cotton t-shirt,800,Vietnam',
  'woven denim jeans,2000,Mexico',
  'hydraulic gear pump,5000,Germany',
  'led power supply module,3000,China',
  'polypropylene storage bin,900,China',
  'assorted promotional goods,400,China',
  'knitted cotton t-shirt,800,Germany'
].join('\n');

// SAMPLE RATES, in percent, keyed "chapter|origin". A pair with no entry is unpriced, not zero.
var SAMPLE_RATES = {
  '61|China': 16.5,
  '61|Vietnam': 12,
  '62|Mexico': 0,
  '73|China': 25,
  '73|Germany': 2.5,
  '84|Germany': 3.5,
  '85|China': 25,
  '39|China': 6.5
};
