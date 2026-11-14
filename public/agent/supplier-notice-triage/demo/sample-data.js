// SAMPLE DATA. Every notice, PO and supplier name here is invented for the demo.
// Nothing in this file is a real supplier, shipment or price.
// Loaded by index.html in a browser and by test.mjs in node.
var SUPPLIER_NOTICE_SAMPLE = {
  // Training notices: the classifier learns from these. Eight per label.
  train: [
    { label: 'slip', text: 'Regret to advise the PO shipment will slip. Vessel rolled to the next sailing, revised ETA Nov 24.' },
    { label: 'slip', text: 'Production line down for two days at our plant, so the ready date moves to 2026-11-19.' },
    { label: 'slip', text: 'Our carrier has moved the sailing date back a week. Expect delivery later than confirmed.' },
    { label: 'slip', text: 'Delay on raw material from our sub-supplier. New promise date Dec 3 for the full quantity.' },
    { label: 'slip', text: 'Customs hold at the origin port, so cargo will ship later than planned. Arrival under review.' },
    { label: 'slip', text: 'We need to push your order out by about two weeks because of a machine breakdown.' },
    { label: 'slip', text: 'Due to port congestion the booking was rolled. Revised ready date: Nov 28.' },
    { label: 'slip', text: 'Apologies, this order will be late. Expected completion moved from Nov 12 to Nov 26.' },

    { label: 'short', text: 'We can only ship 300 of the 500 units on this PO this week. The balance follows later.' },
    { label: 'short', text: 'Shortage of one component limits us to a partial shipment of the quantity.' },
    { label: 'short', text: 'The order will be split: first pallet now, remaining quantity in a second lot.' },
    { label: 'short', text: 'Raw material allocation was cut, so we will deliver a reduced quantity against this line.' },
    { label: 'short', text: 'Only part of the lines can be completed. We are short-shipping 40 pieces.' },
    { label: 'short', text: 'Two line items will not be fulfilled in full this cycle. Quantity reduced accordingly.' },
    { label: 'short', text: 'Balance quantity is not available until the next run. Partial release attached.' },
    { label: 'short', text: 'Units on the schedule are fewer than ordered because of a material shortage upstream.' },

    { label: 'quality', text: 'Our incoming inspection found a dimensional nonconformance, so the lot is placed on quality hold.' },
    { label: 'quality', text: 'Certificate of conformance missing for batch 17. Shipment held pending test results.' },
    { label: 'quality', text: 'Customer audit flagged a defect in the coating. We are quarantining the affected lot.' },
    { label: 'quality', text: 'Failed hardness test on heat 4471. Material is rejected and on hold for review.' },
    { label: 'quality', text: 'Corrective action is underway after a nonconforming weld. Units held in our quality cell.' },
    { label: 'quality', text: 'Lab results show out-of-spec moisture content, so the batch is blocked until retest.' },
    { label: 'quality', text: 'Packaging label error found on the lot. Returned for rework before release.' },
    { label: 'quality', text: 'Surface finish fails the inspection plan. Lot on hold while we investigate the defect.' },

    { label: 'on_track', text: 'Confirming the PO is on schedule. Ready to ship as planned on the original date.' },
    { label: 'on_track', text: 'Production is running well and we expect to meet the promise date.' },
    { label: 'on_track', text: 'Order released to dispatch today. Tracking number will follow.' },
    { label: 'on_track', text: 'No issues to report. The full quantity will ship on time.' },
    { label: 'on_track', text: 'Pallets are packed and waiting for pickup on the confirmed date.' },
    { label: 'on_track', text: 'Good news: we finished early and the full lot is ready to go.' },
    { label: 'on_track', text: 'Schedule confirmed. Delivery remains on the original plan.' },
    { label: 'on_track', text: 'Shipment left our dock this morning, arrival as scheduled.' }
  ],
  // Holdout notices: never trained on. Each names the PO it answers. Expected label is the truth.
  holdout: [
    { id: 'H1', po: 'PO-1001', label: 'slip', text: 'Heads up, the machining cell needs repair so completion slides to December 4.' },
    { id: 'H2', po: 'PO-1002', label: 'slip', text: 'Our forwarder reports a delay at the terminal. The vessel now departs later, arrival likely Dec 9.' },
    { id: 'H3', po: 'PO-1003', label: 'slip', text: 'Carrier has rolled our booking, so the new sailing puts arrival in late December.' },
    { id: 'H4', po: 'PO-1004', label: 'short', text: 'We are short on two parts, so this shipment covers only part of the quantity.' },
    { id: 'H5', po: 'PO-1005', label: 'short', text: 'Only 120 of the 200 pieces are ready. The rest comes next month.' },
    { id: 'H6', po: 'PO-1003', label: 'short', text: 'Half the order will go out now. The other half needs more stock from our supplier.' },
    { id: 'H7', po: 'PO-1002', label: 'quality', text: 'Inspection noted a surface crack on several units. Holding the lot until engineering signs off.' },
    { id: 'H8', po: 'PO-1004', label: 'quality', text: 'Test certificate does not match the spec, so the shipment stays in quarantine.' },
    { id: 'H9', po: 'PO-1005', label: 'quality', text: 'Lot is on hold because a supplier certificate is missing and the test report is pending.' },
    { id: 'H10', po: 'PO-1003', label: 'on_track', text: 'Everything is on track for the confirmed date. Packing starts tomorrow.' },
    { id: 'H11', po: 'PO-1001', label: 'on_track', text: 'Shipment is booked and confirmed for the original arrival.' },
    { id: 'H12', po: 'PO-1004', label: 'on_track', text: 'We are ahead of plan. The goods will be ready on the promised day.' }
  ],
  // Open purchase orders the notices refer to. need = the date the buyer's line needs the goods.
  pos: [
    { po: 'PO-1001', supplier: 'Supplier Alpha (castings)', need: '2026-11-20', qty: 500 },
    { po: 'PO-1002', supplier: 'Supplier Beta (fasteners)', need: '2026-11-15', qty: 2000 },
    { po: 'PO-1003', supplier: 'Supplier Gamma (electronics)', need: '2026-12-01', qty: 300 },
    { po: 'PO-1004', supplier: 'Supplier Delta (packaging)', need: '2026-11-18', qty: 800 },
    { po: 'PO-1005', supplier: 'Supplier Epsilon (coatings)', need: '2026-11-25', qty: 200 }
  ]
};
