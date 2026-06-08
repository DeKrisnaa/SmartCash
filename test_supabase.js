import fs from 'fs';

const url = 'https://xrqsctebfxkugctpkalf.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXNjdGViZnhrdWdjdHBrYWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjI1MjMsImV4cCI6MjA5NDU5ODUyM30.TBJjKGYtrgvI2rMsE3Ugb5fQYV5ybIyvqjU5_Lv9NDU';

async function run() {
  try {
    const res = await fetch(url);
    const spec = await res.json();
    console.log("Tables:", Object.keys(spec.paths));
    
    // Print transactions definition
    const transactionsPath = spec.paths['/transactions'];
    if (transactionsPath) {
      console.log("Transactions POST parameters:", JSON.stringify(transactionsPath.post, null, 2));
    }
    
    // Print transactions schema properties
    const schema = spec.definitions?.transactions;
    if (schema) {
      console.log("Transactions Schema properties:", JSON.stringify(schema.properties, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
