import fs from "node:fs/promises";
import process from "node:process";
import { fromBase64, toBase64 } from "../src/utils.js";

// 1. Configuration from Environment Variables
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

// Helper to execute raw SQL against Cloudflare D1 API
async function executeD1(sql, params = []) {
  const response = await fetch(D1_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`D1 Query Failed: ${JSON.stringify(data)}`);
  }
  return data.result[0].results;
}

async function runHierarchicalInsert() {
  console.log("Starting hierarchical D1 insert...");

  // --- STEP 1: Insert 'a' records ---
  const aRecords = ["2026-07-29", "2026-07-30"];

  // We can insert 'a' records and return their IDs
  for (const dateVal of aRecords) {
    const aResult = await executeD1(
      "INSERT INTO a (date) VALUES (?) RETURNING id;",
      [dateVal],
    );
    const aId = aResult[0].id;
    console.log(`Inserted a (date: ${dateVal}) -> ID: ${aId}`);

    // --- STEP 2: Insert 4 explicit 'b' records for this 'aId' ---
    // Example explicit data for b
    const bPayloads = [
      { shift: "Morning", status: "Active" },
      { shift: "Afternoon", status: "Active" },
      { shift: "Night", status: "Pending" },
      { shift: "Audit", status: "Closed" },
    ];

    for (const bData of bPayloads) {
      // Assuming table 'b' has extra columns for your explicit values
      const bResult = await executeD1(
        "INSERT INTO b (a_id, shift, status) VALUES (?, ?, ?) RETURNING id;",
        [aId, bData.shift, bData.status],
      );
      const bId = bResult[0].id;

      // --- STEP 3: Insert 4 explicit 'c' records for this 'bId' ---
      const cPayloads = [
        { metric: "Temp", val: 72.5 },
        { metric: "Humidity", val: 45 },
        { metric: "Power", val: 120 },
        { metric: "Status", val: 1 },
      ];

      // We can batch construct a single multi-row INSERT for the 4 'c' records
      // since table 'c' is the bottom of the hierarchy!
      const cPlaceholders = cPayloads.map(() => "(?, ?, ?)").join(", ");
      const cParams = cPayloads.flatMap((c) => [bId, c.metric, c.val]);

      await executeD1(
        `INSERT INTO c (b_id, metric, value) VALUES ${cPlaceholders};`,
        cParams,
      );
    }
  }

  console.log("Hierarchical insert completed successfully!");
}

runHierarchicalInsert().catch((err) => {
  console.error(err);
  process.exit(1);
});
