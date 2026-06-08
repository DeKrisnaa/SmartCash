import fs from 'fs';

const url = 'https://xrqsctebfxkugctpkalf.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycXNjdGViZnhrdWdjdHBrYWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjI1MjMsImV4cCI6MjA5NDU5ODUyM30.TBJjKGYtrgvI2rMsE3Ugb5fQYV5ybIyvqjU5_Lv9NDU';

async function run() {
  try {
    const res = await fetch(url);
    const spec = await res.json();
    const schema = spec.definitions?.transactions;
    if (schema) {
      console.log("TRANSACTIONS SCHEMA:");
      console.log(JSON.stringify(schema, null, 2));
    } else {
      console.log("No transactions definition found in definitions.");
      console.log("Available definitions:", Object.keys(spec.definitions || {}));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
