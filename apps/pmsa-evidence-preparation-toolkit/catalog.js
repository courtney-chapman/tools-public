// Public-source evidence prompts. See docs/evidence-catalog.md for citations and classifications.
const CATALOG = Object.freeze([
  {
    "id": "1-1",
    "element": 1,
    "name": "Written Procedures",
    "category": "Property management procedures",
    "prompt": "Identify the current procedures used to manage Government property.",
    "source": "[F] (b)(1), (f)(1); [J] Elem. 1, pp. 54–56",
    "classification": "Regulatory requirement",
    "applicability": "Applies under the incorporated Government Property clause; the app does not judge procedure adequacy."
  },
  {
    "id": "1-2",
    "element": 1,
    "name": "Written Procedures",
    "category": "Contract and referenced standards",
    "prompt": "Note the contract and any external standard the procedures reference.",
    "source": "[J] Elem. 1, p. 56",
    "classification": "DCMA assessment guidance",
    "applicability": "Include a standard only if the procedures actually use it."
  },
  {
    "id": "2-1",
    "element": 2,
    "name": "Contractor Self-Assessment",
    "category": "Assessment procedures",
    "prompt": "Identify procedures for periodic internal property-system reviews.",
    "source": "[F] (b)(4); [J] Elem. 2, pp. 59–60",
    "classification": "Regulatory requirement",
    "applicability": "Frequency and method come from the applicable contract and contractor procedures."
  },
  {
    "id": "2-2",
    "element": 2,
    "name": "Contractor Self-Assessment",
    "category": "Previous review support",
    "prompt": "Reference a prior review report and workpapers, if available.",
    "source": "[J] Elem. 2, pp. 61–62",
    "classification": "DCMA assessment guidance",
    "applicability": "No report format or finding is prescribed by this prompt."
  },
  {
    "id": "3-1",
    "element": 3,
    "name": "Acquisition",
    "category": "Acquisition source records",
    "prompt": "Reference purchase, requisition, or fabrication records for Government property.",
    "source": "[F] (f)(1)(i); [J] Elem. 3, pp. 63–66",
    "classification": "Regulatory requirement",
    "applicability": "Use records fitting the way property was acquired."
  },
  {
    "id": "3-2",
    "element": 3,
    "name": "Acquisition",
    "category": "Planning support",
    "prompt": "Note a material list, work description, or drawing supporting an acquisition.",
    "source": "[J] Elem. 3, pp. 65–66",
    "classification": "DCMA assessment guidance",
    "applicability": "Examples vary with contract and type of work."
  },
  {
    "id": "4-1",
    "element": 4,
    "name": "Receiving",
    "category": "Receipt documents",
    "prompt": "Identify delivery or receiving records for property received.",
    "source": "[F] (f)(1)(ii); [J] Elem. 4, pp. 68–70",
    "classification": "Regulatory requirement",
    "applicability": "The form depends on how property arrived."
  },
  {
    "id": "4-2",
    "element": 4,
    "name": "Receiving",
    "category": "Receiving-to-record references",
    "prompt": "Link a receiving log or report to the related property record, if used.",
    "source": "[J] Elem. 4, pp. 69–71",
    "classification": "DCMA assessment guidance",
    "applicability": "This prompt does not post or reconcile records."
  },
  {
    "id": "5-1",
    "element": 5,
    "name": "Discrepancies Incident to Shipment",
    "category": "GFP discrepancy statement",
    "prompt": "Reference a written statement to the Property Administrator about a GFP receipt discrepancy.",
    "source": "[F] (f)(1)(ii)(A); [J] Elem. 5, pp. 72–74",
    "classification": "Conditional requirement",
    "applicability": "Relevant when a GFP receipt discrepancy was discovered."
  },
  {
    "id": "5-2",
    "element": 5,
    "name": "Discrepancies Incident to Shipment",
    "category": "CAP vendor discrepancy support",
    "prompt": "Reference vendor adjustments or other records addressing a CAP receipt discrepancy.",
    "source": "[F] (f)(1)(ii)(B); [J] Elem. 5, pp. 72–74",
    "classification": "DCMA assessment guidance",
    "applicability": "FAR requires action to adjust a discovered discrepancy; this prompt suggests supporting references."
  },
  {
    "id": "6-1",
    "element": 6,
    "name": "Identification",
    "category": "Property marking reference",
    "prompt": "Record where an applicable Government-ownership mark or identifier can be checked.",
    "source": "[F] (f)(1)(ii); [J] Elem. 6, pp. 75–77",
    "classification": "DCMA assessment guidance",
    "applicability": "FAR requires suitable identification; this prompt suggests a preparation reference."
  },
  {
    "id": "6-2",
    "element": 6,
    "name": "Identification",
    "category": "Identification record",
    "prompt": "Reference a record or description linking an item to its marking.",
    "source": "[J] Elem. 6, pp. 75–77",
    "classification": "DCMA assessment guidance",
    "applicability": "A written reference does not replace examination of the item."
  },
  {
    "id": "7-1",
    "element": 7,
    "name": "Records",
    "category": "Accountable property records",
    "prompt": "Identify the current records for property accountable to the contract.",
    "source": "[F] (f)(1)(iii)(A); [J] Elem. 7, pp. 78–83",
    "classification": "Regulatory requirement",
    "applicability": "Additional fields may depend on the contract, including [D5] when incorporated."
  },
  {
    "id": "7-2",
    "element": 7,
    "name": "Records",
    "category": "Transaction source support",
    "prompt": "Reference documents supporting selected property-record changes.",
    "source": "[J] Elem. 7, pp. 78–83",
    "classification": "DCMA assessment guidance",
    "applicability": "Examples include receipt, issue, inventory, loss, transfer, and disposal records."
  },
  {
    "id": "8-1",
    "element": 8,
    "name": "Receipt and Issue System",
    "category": "System approval",
    "prompt": "Reference Property Administrator approval if a receipt-and-issue system is used.",
    "source": "[F] (f)(1)(iii)(B); [J] Elem. 8, pp. 84–86",
    "classification": "Conditional requirement",
    "applicability": "Do not imply a separate approved system is required when none is used."
  },
  {
    "id": "8-2",
    "element": 8,
    "name": "Receipt and Issue System",
    "category": "Receipt and issue documents",
    "prompt": "Identify documents showing receipt, issue, and use under the system, if used.",
    "source": "[J] Elem. 8, pp. 84–86",
    "classification": "DCMA assessment guidance",
    "applicability": "Relevant only to the user's actual receipt-and-issue process."
  },
  {
    "id": "9-1",
    "element": 9,
    "name": "Physical Inventory",
    "category": "Inventory results",
    "prompt": "Reference recorded physical inventory results.",
    "source": "[F] (f)(1)(iv); [J] Elem. 9, pp. 87–91",
    "classification": "Regulatory requirement",
    "applicability": "Inventory method and schedule are contract and procedure dependent."
  },
  {
    "id": "9-2",
    "element": 9,
    "name": "Physical Inventory",
    "category": "Inventory adjustment support",
    "prompt": "Link count sheets or scanner records to related adjustments, if any.",
    "source": "[J] Elem. 9, pp. 87–91",
    "classification": "DCMA assessment guidance",
    "applicability": "An adjustment reference is relevant only when an adjustment occurred."
  },
  {
    "id": "10-1",
    "element": 10,
    "name": "Subcontractor Awards and Flow Down",
    "category": "Property-bearing subcontracts",
    "prompt": "Identify subcontracts that specify Government property provided for performance.",
    "source": "[F] (f)(1)(v)(A); [J] Elem. 10, pp. 92–94",
    "classification": "Regulatory requirement",
    "applicability": "Relevant to subcontracts under which Government property is furnished or acquired."
  },
  {
    "id": "10-2",
    "element": 10,
    "name": "Subcontractor Awards and Flow Down",
    "category": "Property terms in subcontracts",
    "prompt": "Reference applicable property restrictions and flowed-down terms.",
    "source": "[F] (b)(3), (f)(1)(v)(A); [J] Elem. 10, pp. 92–94",
    "classification": "Regulatory requirement",
    "applicability": "Terms depend on the subcontract and prime contract."
  },
  {
    "id": "11-1",
    "element": 11,
    "name": "Subcontractor Reviews",
    "category": "Subcontractor review records",
    "prompt": "Reference periodic property-system review reports or equivalent records.",
    "source": "[J] Elem. 11, pp. 95–97; [F] (f)(1)(v)(B)",
    "classification": "DCMA assessment guidance",
    "applicability": "FAR requires reviews; this prompt does not prescribe their format."
  },
  {
    "id": "11-2",
    "element": 11,
    "name": "Subcontractor Reviews",
    "category": "Review workpapers",
    "prompt": "Link supporting workpapers or data to a subcontractor review, if available.",
    "source": "[J] Elem. 11, pp. 95–97",
    "classification": "DCMA assessment guidance",
    "applicability": "Use only for subcontractors within the preparation scope."
  },
  {
    "id": "12-1",
    "element": 12,
    "name": "Reports",
    "category": "Property reporting process",
    "prompt": "Identify the procedure for producing directed property-related reports.",
    "source": "[F] (f)(1)(vi); [J] Elem. 12, pp. 98–100",
    "classification": "Regulatory requirement",
    "applicability": "The particular reports depend on contract and direction."
  },
  {
    "id": "12-2",
    "element": 12,
    "name": "Reports",
    "category": "Issued report references",
    "prompt": "List applicable inventory, loss, self-assessment, or other property reports.",
    "source": "[J] Elem. 12, pp. 98–100; [D5] (b)",
    "classification": "DCMA assessment guidance",
    "applicability": "GFP Module reports are relevant only when [D5] is incorporated."
  },
  {
    "id": "13-1",
    "element": 13,
    "name": "Relief of Stewardship",
    "category": "Property loss reports",
    "prompt": "Reference reports of property loss, if any.",
    "source": "[F] (f)(1)(vii)(B); [J] Elem. 13, pp. 101–104",
    "classification": "Conditional requirement",
    "applicability": "Relevant when a property-loss incident occurred."
  },
  {
    "id": "13-2",
    "element": 13,
    "name": "Relief of Stewardship",
    "category": "Loss support and decisions",
    "prompt": "Link related property records or Government relief decisions, if any.",
    "source": "[J] Elem. 13, pp. 101–104",
    "classification": "DCMA assessment guidance",
    "applicability": "This tool does not investigate loss or grant relief."
  },
  {
    "id": "14-1",
    "element": 14,
    "name": "Utilization",
    "category": "Utilization review records",
    "prompt": "Reference records showing review of property use.",
    "source": "[J] Elem. 14, pp. 105–106",
    "classification": "DCMA assessment guidance",
    "applicability": "The app does not measure utilization."
  },
  {
    "id": "14-2",
    "element": 14,
    "name": "Utilization",
    "category": "Other-work use authority",
    "prompt": "Reference the contract term or Contracting Officer approval allowing use on other work, if applicable.",
    "source": "[F] (c)(1); [J] Elem. 14, pp. 105–106",
    "classification": "Conditional requirement",
    "applicability": "Relevant only when use outside the accountable contract is proposed or authorized."
  },
  {
    "id": "15-1",
    "element": 15,
    "name": "Declaration of Excess",
    "category": "Excess disclosure",
    "prompt": "Reference disclosure or reporting of property identified as excess.",
    "source": "[F] (f)(1)(viii)(A); [J] Elem. 15, pp. 107–109",
    "classification": "Conditional requirement",
    "applicability": "Relevant when property is identified as excess to contract needs."
  },
  {
    "id": "15-2",
    "element": 15,
    "name": "Declaration of Excess",
    "category": "Retention direction",
    "prompt": "Reference a contract modification or approval for retention, if any.",
    "source": "[J] Elem. 15, pp. 107–109",
    "classification": "DCMA assessment guidance",
    "applicability": "The app does not decide whether retention is allowed."
  },
  {
    "id": "16-1",
    "element": 16,
    "name": "Consumption",
    "category": "Consumption record",
    "prompt": "Identify records of Government material consumed in performance.",
    "source": "[J] Elem. 16, pp. 110–113; [F] (f)(1)(iii)(A)",
    "classification": "DCMA assessment guidance",
    "applicability": "Relevant where Government material is consumed or expended."
  },
  {
    "id": "16-2",
    "element": 16,
    "name": "Consumption",
    "category": "Production or issue support",
    "prompt": "Link issue records, material lists, or work instructions to consumption.",
    "source": "[J] Elem. 16, pp. 110–113",
    "classification": "DCMA assessment guidance",
    "applicability": "Supporting document type varies by contract work."
  },
  {
    "id": "17-1",
    "element": 17,
    "name": "Movement",
    "category": "Movement record",
    "prompt": "Reference move tickets, shipping records, or custody-transfer documents.",
    "source": "[J] Elem. 17, pp. 114–116",
    "classification": "DCMA assessment guidance",
    "applicability": "Relevant only to movements within preparation scope."
  },
  {
    "id": "17-2",
    "element": 17,
    "name": "Movement",
    "category": "Movement authority",
    "prompt": "Reference contract instructions or approval for a movement, if required.",
    "source": "[F] (f)(1)(viii)(A); [J] Elem. 17, pp. 114–116",
    "classification": "Conditional requirement",
    "applicability": "The app does not authorize movement or transfer accountability."
  },
  {
    "id": "18-1",
    "element": 18,
    "name": "Storage",
    "category": "Storage area reference",
    "prompt": "Note the location or an existing observation record for a storage area.",
    "source": "[J] Elem. 18, pp. 117–119",
    "classification": "Optional preparation practice",
    "applicability": "The Job Aid lists no source documents; a reference cannot prove physical conditions."
  },
  {
    "id": "18-2",
    "element": 18,
    "name": "Storage",
    "category": "Special storage direction",
    "prompt": "Reference special storage approval or instructions, if applicable.",
    "source": "[J] Elem. 18, pp. 117–119",
    "classification": "DCMA assessment guidance",
    "applicability": "Include only when a contract or agency requires special storage."
  },
  {
    "id": "19-1",
    "element": 19,
    "name": "Storage Commingling",
    "category": "Commingling authorization",
    "prompt": "Reference contractual or Property Administrator authorization, if used.",
    "source": "[F] (f)(1)(viii)(B); [J] Elem. 19, pp. 120–122",
    "classification": "Conditional requirement",
    "applicability": "Relevant only when Government material is commingled."
  },
  {
    "id": "19-2",
    "element": 19,
    "name": "Storage Commingling",
    "category": "Storage location reference",
    "prompt": "Note the location or an existing observation record for commingled material.",
    "source": "[J] Elem. 19, pp. 120–122",
    "classification": "Optional preparation practice",
    "applicability": "The Job Aid lists no source documents; physical conditions still need review."
  },
  {
    "id": "20-1",
    "element": 20,
    "name": "Maintenance",
    "category": "Maintenance records",
    "prompt": "Reference maintenance, calibration, or repair records for applicable property.",
    "source": "[J] Elem. 20, pp. 123–125; [F] (f)(1)(ix)",
    "classification": "DCMA assessment guidance",
    "applicability": "Record type depends on the property and maintenance program."
  },
  {
    "id": "20-2",
    "element": 20,
    "name": "Maintenance",
    "category": "Maintenance instructions",
    "prompt": "Reference the maintenance schedule, manual, or contract provision used.",
    "source": "[J] Elem. 20, pp. 123–125",
    "classification": "DCMA assessment guidance",
    "applicability": "Do not imply every item requires calibration."
  },
  {
    "id": "21-1",
    "element": 21,
    "name": "Disposal",
    "category": "Disposal direction",
    "prompt": "Reference Plant Clearance Officer instructions or other applicable authority.",
    "source": "[F] (j), (k); [J] Elem. 21, pp. 126–129",
    "classification": "Conditional requirement",
    "applicability": "Relevant when contractor inventory is being disposed of."
  },
  {
    "id": "21-2",
    "element": 21,
    "name": "Disposal",
    "category": "Disposal action records",
    "prompt": "Reference shipping, transfer, sale, or scrap documents for completed actions.",
    "source": "[J] Elem. 21, pp. 126–129",
    "classification": "DCMA assessment guidance",
    "applicability": "The toolkit does not prepare or execute disposition."
  },
  {
    "id": "22-1",
    "element": 22,
    "name": "Property Closeout",
    "category": "Closeout report",
    "prompt": "Reference the report of completed contract property closeout.",
    "source": "[F] (f)(1)(x); [J] Elem. 22, pp. 130–133",
    "classification": "Regulatory requirement",
    "applicability": "Relevant at contract completion or termination under applicable terms."
  },
  {
    "id": "22-2",
    "element": 22,
    "name": "Property Closeout",
    "category": "Final inventory support",
    "prompt": "Link final inventory, open loss, and disposition references used for closeout.",
    "source": "[F] (f)(1)(x); [J] Elem. 22, pp. 130–133",
    "classification": "DCMA assessment guidance",
    "applicability": "FAR generally requires final inventory at closeout unless waived; this prompt suggests supporting references."
  }
]);
