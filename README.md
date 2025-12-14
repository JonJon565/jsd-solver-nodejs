# Installation 
```bash
npm i https://github.com/JonJon565/jsd-solver-nodejs
```


# Normal Usage
```js
const { CloudflareJSDSolver, clientFetch } = require("jsd-solver-nodejs");
const cloudflareJSDSolver = new CloudflareJSDSolver();
const cf_clearance = await cloudflareJSDSolver.generateCF_Clearance("https://example.com/path");
console.log(cf_clearance);// _xedK7.........
```

# Custom Fetch Usage
```js

//Check ./browser/ to create your own fetch handler (bogdan tls-client)
//These are the hardcoded default paramaters.

const { CloudflareJSDSolver, clientFetch } = require("jsd-solver-nodejs");
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

const cloudflareJSDSolver = new CloudflareJSDSolver(clientFetch, clientInformation, sec_ch_ua);
const cf_clearance = await cloudflareJSDSolver.generateCF_Clearance("https://example.com/path", /* OPTIONAL main.js url if its custom*/);
console.log(cf_clearance);// _xedK7.........
```

