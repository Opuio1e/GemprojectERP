import { nanoid } from 'nanoid';
import { db } from '../db';
import type {
  InventoryRecord,
  LedgerEntry,
  Lot,
  Memo,
  Party,
  ProductionStageEvent,
  SellRecord
} from '../types';
import { logAudit } from './audit';

export const seedDatabase = async () => {
  const shouldSeed =
    import.meta.env.DEV && import.meta.env.VITE_SEED_DATABASE === 'true';
  if (!shouldSeed) return;

  const partyCount = await db.parties.count();
  if (partyCount > 0) return;

  const parties: Party[] = [
    { id: nanoid(), name: 'Aditi Gems', category: 'Buyer', phone: '555-2001' },
    { id: nanoid(), name: 'Riya Traders', category: 'Supplier', phone: '555-4880' }
  ];

  const lots: Lot[] = [
    {
      id: nanoid(),
      lotNo: 'LOT-001',
      description: 'Oval mix',
      shape: 'Oval',
      size: '4x6',
      grade: 'A',
      source: 'Factory',
      totalCts: 120,
      totalPcs: 80
    },
    {
      id: nanoid(),
      lotNo: 'LOT-002',
      description: 'Round stones',
      shape: 'Round',
      size: '3x3',
      grade: 'B',
      source: 'Market',
      totalCts: 90,
      totalPcs: 60
    }
  ];

  const inventoryRecords: InventoryRecord[] = [
    {
      id: nanoid(),
      sellId: 'SELL-101',
      date: new Date().toISOString().slice(0, 10),
      partyId: parties[0].id,
      lotId: lots[0].id,
      format: 'Calip',
      shape: 'Oval',
      size: '4x6',
      description: 'Mixed oval cut',
      cts: 24,
      amount: 3600,
      status: 'available'
    },
    {
      id: nanoid(),
      sellId: 'SELL-102',
      date: new Date().toISOString().slice(0, 10),
      partyId: parties[1].id,
      lotId: lots[1].id,
      format: 'Parcel',
      shape: 'Round',
      size: '3x3',
      description: 'Round brilliant',
      cts: 18,
      amount: 2200,
      status: 'sold'
    }
  ];

  const sellRecords: SellRecord[] = [
    {
      id: nanoid(),
      sellId: 'SELL-102',
      date: new Date().toISOString().slice(0, 10),
      partyId: parties[1].id,
      transactionType: 'Cash',
      lineItems: [
        {
          id: nanoid(),
          srNo: 1,
          lotNo: lots[1].lotNo,
          description: 'Round brilliant',
          shape: 'Round',
          size: '3x3',
          grade: 'B',
          pcs: 20,
          cts: 18,
          price: 122,
          amount: 2196
        }
      ]
    }
  ];

  const memos: Memo[] = [
    {
      id: nanoid(),
      memoNo: 'MEMO-55',
      date: new Date().toISOString().slice(0, 10),
      partyId: parties[0].id,
      lotId: lots[0].id,
      stage: 'Preform',
      direction: 'out',
      status: 'open',
      notes: 'Sent for preform cutting'
    }
  ];

  const productionStages: ProductionStageEvent[] = [
    {
      id: nanoid(),
      lotId: lots[0].id,
      stage: 'Preform',
      date: new Date().toISOString().slice(0, 10),
      inputCts: 24,
      outputCts: 21,
      rejectCts: 2,
      wastageCts: 1,
      notes: 'Initial shaping'
    }
  ];

  const ledgerEntries: LedgerEntry[] = [
    {
      id: nanoid(),
      date: new Date().toISOString().slice(0, 10),
      partyId: parties[1].id,
      lotId: lots[1].id,
      process: 'Sale',
      debit: 0,
      credit: 2196,
      notes: 'Invoice INV-001',
      posted: true
    }
  ];

  await db.parties.bulkAdd(parties);
  await db.lots.bulkAdd(lots);
  await db.inventoryRecords.bulkAdd(inventoryRecords);
  await db.sellRecords.bulkAdd(sellRecords);
  await db.memos.bulkAdd(memos);
  await db.productionStages.bulkAdd(productionStages);
  await db.ledgerEntries.bulkAdd(ledgerEntries);

  await logAudit('system', 'seed', 'create', 'Seeded initial demo data');
};
