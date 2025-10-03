/**
 * Script to geocode properties from fastigheter_ekofast.csv using Google Maps Geocoding API
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=your_api_key node geocode-properties.js
 *
 * This will:
 * 1. Read the CSV file
 * 2. For each property, geocode the address using Google Maps API
 * 3. Add latitude and longitude columns
 * 4. Save to a new CSV file with geocoding data
 */

const fs = require('fs');
const https = require('https');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const INPUT_FILE = './fastigheter_ekofast.csv';
const OUTPUT_FILE = './fastigheter_ekofast_geocoded.csv';
const DELAY_MS = 200; // Delay between requests to avoid rate limiting

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY environment variable is required');
  console.error('Usage: GOOGLE_MAPS_API_KEY=your_api_key node geocode-properties.js');
  process.exit(1);
}

// Read and parse CSV
function readCSV(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (doesn't handle quotes with commas inside)
    const values = lines[i].split(',');
    const row = {
      fastighet: values[0] ? values[0].trim() : '',
      popularnamn: values[1] ? values[1].trim() : ''
    };
    data.push(row);
  }

  return data;
}

// Geocode an address using Google Maps API
function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const encodedAddress = encodeURIComponent(address + ', Falkenberg, Sweden');
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${API_KEY}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);

          if (result.status === 'OK' && result.results.length > 0) {
            const location = result.results[0].geometry.location;
            resolve({
              lat: location.lat,
              lng: location.lng,
              formatted_address: result.results[0].formatted_address
            });
          } else if (result.status === 'ZERO_RESULTS') {
            console.warn(`  ⚠️  No results for: ${address}`);
            resolve({ lat: null, lng: null, formatted_address: null });
          } else {
            console.error(`  ❌ Error geocoding ${address}: ${result.status}`);
            resolve({ lat: null, lng: null, formatted_address: null });
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function
async function main() {
  console.log('🚀 Starting geocoding process...\n');
  console.log(`Reading CSV from: ${INPUT_FILE}`);

  const properties = readCSV(INPUT_FILE);
  console.log(`Found ${properties.length} properties\n`);

  const geocodedProperties = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];

    // Skip empty rows
    if (!prop.fastighet && !prop.popularnamn) {
      geocodedProperties.push({
        ...prop,
        lat: null,
        lng: null,
        formatted_address: null
      });
      continue;
    }

    // Use popularnamn if available, otherwise use fastighet
    const searchQuery = prop.popularnamn || prop.fastighet;

    console.log(`[${i + 1}/${properties.length}] Geocoding: ${searchQuery}`);

    try {
      const location = await geocodeAddress(searchQuery);
      geocodedProperties.push({
        ...prop,
        ...location
      });

      if (location.lat && location.lng) {
        console.log(`  ✅ Success: ${location.lat}, ${location.lng}`);
        successCount++;
      } else {
        failCount++;
      }

      // Add delay to avoid rate limiting
      if (i < properties.length - 1) {
        await delay(DELAY_MS);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      geocodedProperties.push({
        ...prop,
        lat: null,
        lng: null,
        formatted_address: null
      });
      failCount++;
    }
  }

  // Write results to CSV
  console.log('\n📝 Writing results to CSV...');

  const csvLines = [
    'Fastighet,Populärnamn,Latitude,Longitude,Formatted Address'
  ];

  for (const prop of geocodedProperties) {
    const fastighet = prop.fastighet || '';
    const popularnamn = prop.popularnamn || '';
    const lat = prop.lat !== null ? prop.lat : '';
    const lng = prop.lng !== null ? prop.lng : '';
    const formatted = prop.formatted_address || '';

    // Escape commas in text fields
    const escapedFastighet = fastighet.includes(',') ? `"${fastighet}"` : fastighet;
    const escapedPopularnamn = popularnamn.includes(',') ? `"${popularnamn}"` : popularnamn;
    const escapedFormatted = formatted.includes(',') ? `"${formatted}"` : formatted;

    csvLines.push(`${escapedFastighet},${escapedPopularnamn},${lat},${lng},${escapedFormatted}`);
  }

  fs.writeFileSync(OUTPUT_FILE, csvLines.join('\n'));

  console.log(`\n✅ Done! Results written to: ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total properties: ${properties.length}`);
  console.log(`   Successfully geocoded: ${successCount}`);
  console.log(`   Failed/Not found: ${failCount}`);
}

main().catch(console.error);
