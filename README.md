#Installation 
`npm install`

#Usage
```js
const { CloudflareJSDSolver, clientFetch } = require("C:\\Users\\ivant\\Documents\\Github\\jsd-solver-nodejs\\index");
const clientInformation = {
  vendor: "Google Inc.",
  appCodeName: "Mozilla",
  appName: "Netscape",
  appVersion: "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  platform: "Win32",
  product: "Gecko",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  language: "en-GB"
};
const sec_ch_ua = "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"";
//These are the Default paramaters.
//Check ./browser to create your own clientFetch (bogdan tls-client)
//Leave blank if you want to use the default Chrome 142) e.g.. new CloudflareJSDSolver()
const cloudflareJSDSolver = new CloudflareJSDSolver(clientFetch, clientInformation, sec_ch_ua);
const cf_clearance = await cloudflareJSDSolver.generateCF_Clearance("https://example.com/path", /* OPTIONAL main.js url if its custom*/);
console.log(cf_clearance);// _xedK7.........
```

