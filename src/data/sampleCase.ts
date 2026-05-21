/**
 * Sample Case Data — Fictional business contract dispute
 * "Apex Logistics v. Northstar Retail"
 */

import type { CaseData } from '../types/courtroom';

export const SAMPLE_CASE: CaseData = {
  id: 'case-001',
  title: 'Apex Logistics v. Northstar Retail',
  caseType: 'Civil Contract Dispute',
  plaintiffSide: 'Apex Logistics Inc.',
  defenseSide: 'Northstar Retail Corp.',
  claimSummary: 'Northstar Retail breached a supply agreement by refusing payment after delayed deliveries. Apex claims Northstar refused to pay $247,500 for delivered goods despite meeting contractual obligations, citing fabricated delay claims.',
  keyFacts: [
    'On March 15, 2024, Apex Logistics and Northstar Retail signed a supply agreement for quarterly electronics deliveries.',
    'Delivery schedule required shipments by the 15th of each month in the quarter.',
    'April shipment was delayed 4 days due to supplier factory issue (documented).',
    'May shipment arrived 2 days late due to weather disruption.',
    'June shipment delivered on time per original schedule.',
    'Northstar sent payment refusal letter on June 30, citing consistent delays as breach.',
    'Apex had valid force majeure documentation for April delay.',
    'Northstar continued accepting and selling inventory during dispute period.',
  ],
  evidenceItems: [
    {
      id: 'ev-001',
      title: 'Signed Supply Agreement',
      type: 'document',
      summary: 'Master supply contract signed March 15, 2024 between both parties outlining delivery terms, payment schedule (Net 45), and force majeure clause.',
      introducedBy: 'prosecutor',
      status: 'pending',
      content: 'This Supply Agreement ("Agreement") is entered into by and between Apex Logistics Inc. ("Supplier") and Northstar Retail Corp. ("Buyer")... Section 4.2 Delivery Schedule: Supplier shall deliver monthly shipments by the 15th of each calendar quarter... Section 7.1 Force Majeure: Neither party shall be liable for delays caused by circumstances beyond reasonable control...'
    },
    {
      id: 'ev-002',
      title: 'Delivery Logs',
      type: 'document',
      summary: 'Official delivery confirmation records showing dates and signatures for all Q2 2024 shipments.',
      introducedBy: 'prosecutor',
      status: 'pending',
      content: 'Delivery Log - Q2 2024: [Apr] Shipment #A-4521 - Ship Date: Apr 19 (Delayed) - Received: Apr 19 - Notes: Weather-related delay at origin... [May] Shipment #A-4632 - Ship Date: May 13 (On Schedule) - Received: May 14 - Weather hold... [Jun] Shipment #A-4745 - Ship Date: Jun 12 (On Time) - Received: Jun 12 - Full delivery.'
    },
    {
      id: 'ev-003',
      title: 'Email Notice About Delays',
      type: 'email',
      summary: 'Email from Apex to Northstar notifying of April delay with force majeure documentation attached.',
      introducedBy: 'prosecutor',
      status: 'pending',
      content: 'From: john.smith@apexlogistics.com To: procurement@northstarretail.com Date: April 16, 2024 Subject: Force Majeure Notice - Q2 Deliveries Dear Northstar Team, We are writing to notify you that our April shipment will be delayed by approximately 4 days due to an unforeseen manufacturing issue at our primary supplier facility. Please find attached the force majeure documentation. We appreciate your understanding.'
    },
    {
      id: 'ev-004',
      title: 'Payment Refusal Letter',
      type: 'document',
      summary: 'Formal letter from Northstar refusing payment citing breach due to consistent delivery delays.',
      introducedBy: 'defense',
      status: 'pending',
      content: 'June 30, 2024 Apex Logistics Inc. Attn: Accounts Receivable Re: Payment Refusal - Invoice #INV-2024-Q2 Dear Apex, After careful review, Northstar Retail must refuse payment for Q2 2024 shipments. Consistent delivery delays constitute material breach of our Supply Agreement. Total withheld: $247,500. We reserve all rights under Section 9.3 of the Agreement.'
    },
    {
      id: 'ev-005',
      title: 'Warehouse Inspection Note',
      type: 'document',
      summary: 'Internal Northstar memo showing received inventory was sold during dispute period.',
      introducedBy: 'defense',
      status: 'pending',
      content: 'Internal Memo - July 5, 2024 From: Operations Manager To: Legal Department RE: Inventory Status Note: All Q2 shipments from Apex have been received and processed. Inventory currently allocated to: - Store distribution: 60% - Online fulfillment: 25% - Returned to warehouse: 15% Total retail value of received goods: ~$310,000'
    },
  ],
  legalQuestions: [
    'Did Northstar Retail have valid grounds to refuse payment under the supply agreement?',
    'Does the force majeure clause cover the April delay?',
    'Was Northstar\'s acceptance and sale of goods during the dispute period a waiver of their breach claims?',
    'What is the appropriate remedy for the alleged breach?',
  ],
};
