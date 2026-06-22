const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'pikahd-complete', '02-all-detailed.json');

function fetch(url, retries = 2) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { clearTimeout(timeout); resolve(data); });
    }).on('error', (e) => {
      clearTimeout(timeout);
      if (retries > 0) setTimeout(() => fetch(url, retries - 1).then(resolve).catch(reject), 1000);
      else reject(e);
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPlayData(playUrl) {
  try {
    const html = await fetch(playUrl);
    const match = html.match(/__sveltekit_1oald8e\.resolve\(\{id:1,data:(\{.*?\})\}/s);
    if (match) {
      let jsonStr = match[1].replace(/void 0/g, 'null');
      const data = JSON.parse(jsonStr);
      if (data.data && data.data.info) {
        return data.data;
      }
    }
  } catch (e) {
    console.log(`  Error fetching play data: ${e.message}`);
  }
  return null;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  const needPlayData = data.filter(a => a.playLink && !a.playData);
  console.log(`Total items: ${data.length}`);
  console.log(`With playLink: ${data.filter(a => a.playLink).length}`);
  console.log(`Need playData: ${needPlayData.length}`);
  
  let updated = 0;
  for (let i = 0; i < needPlayData.length; i++) {
    const item = needPlayData[i];
    console.log(`[${i+1}/${needPlayData.length}] ${item.title?.substring(0, 50)}...`);
    
    const playData = await fetchPlayData(item.playLink);
    if (playData) {
      const idx = data.findIndex(a => a.id === item.id);
      if (idx !== -1) {
        data[idx].playData = playData;
        updated++;
      }
    }
    
    if (i % 10 === 0 && i > 0) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      console.log(`  Saved ${updated} items so far...`);
    }
    
    await sleep(300);
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`\nDone! Updated ${updated} items with play data.`);
}

main().catch(console.error);
