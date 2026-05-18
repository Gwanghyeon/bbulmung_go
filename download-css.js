const fs = require('fs');
const https = require('https');

https.get('https://github.com/aprescott/tenuki/releases/download/v0.3.1/tenuki.css', (res) => {
  if (res.statusCode === 302 || res.statusCode === 301) {
    https.get(res.headers.location, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => fs.writeFileSync('public/tenuki.css', data));
    });
  } else {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => fs.writeFileSync('public/tenuki.css', data));
  }
}).on('error', (e) => {
  console.error(e);
});
