const babel = require("@babel/core");
const traverse = require("@babel/traverse").default;

const { isStringFunction, isStringManipulationFunction, RegexStorage, generateLookupIndex, compressPayload,
    deobfuscateAssignment, JSONParse, cleanupDeadcode, replaceComputedProperties } = require("./utils");

const { getPayload } = require("./CFPayload");
const { clientFetch } = require("./browser/browser");

class CloudflareJSDSolver {
    constructor(browserFetch, clientInformation, sec_ch_ua){
        this.browserFetch = browserFetch || clientFetch;
        this.clientInformation = clientInformation || {
            vendor: "Google Inc.",
            appCodeName: "Mozilla",
            appName: "Netscape",
            appVersion: "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            platform: "Win32",
            product: "Gecko",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
            language: "en-GB"
        };
        this.sec_ch_ua = sec_ch_ua || "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"";
    }
    async generateCF_Clearance(url, javascriptUrl){
        let urlClassed = new URL(url);

        const extraHeaders_html =  {
            "cache-control": "max-age=0",
            "priority": "u=0, i",
            "sec-ch-ua": this.sec_ch_ua,
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1"
        }
        const extraHeaders_javascript = {
            "sec-ch-ua": extraHeaders_html["sec-ch-ua"],
            "sec-ch-ua-mobile": extraHeaders_html["sec-ch-ua-mobile"],
            "sec-ch-ua-platform": extraHeaders_html["sec-ch-ua-platform"]
        };
        const extraHeaders_post = {
            "content-type": "text/plain;charset=UTF-8",
            "origin": urlClassed.origin,
            "priority": "u=1, i",
            "sec-ch-ua": extraHeaders_html["sec-ch-ua"],
            "sec-ch-ua-mobile": extraHeaders_html["sec-ch-ua-mobile"],
            "sec-ch-ua-platform": extraHeaders_html["sec-ch-ua-platform"],
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin"
        };

        const html = (await this.browserFetch(urlClassed, { headers: extraHeaders_html, method: "GET" })).body;
        if(!html) throw new Error("body is null");
        const javascript = (await this.browserFetch(javascriptUrl || `https://${urlClassed.host}/cdn-cgi/challenge-platform/scripts/jsd/main.js`, { headers: extraHeaders_javascript, method: "GET" })).body;
        if(!javascript) throw new Error("javascript is null");

        const ast = babel.parse(javascript);
        const getCode = path => path.start ? javascript.substring(path.start, path.end) : javascript.substring(path.node.start, path.node.end);

        const lookup = {
            mainString: null,
            mainStringFunction: null,
            manipulationReference: null,
            manipulationFunction: null,
            getAtIndexFunction: null,
            getAtIndexNumber: null
        }
        traverse(ast, {
            FunctionDeclaration(path){
                if(isStringFunction(path)){
                    lookup.mainString = path?.node?.body?.body?.[0]?.argument?.expressions?.[0]?.right?.callee?.object?.value;
                    lookup.mainStringFunction = path;
                    let references = path.scope.getBinding(path.node.id.name).referencePaths;
                    lookup.manipulationReference = references.find(p => isStringManipulationFunction(p.parentPath));
                    lookup.manipulationFunction = lookup.manipulationReference.parentPath
                    lookup.getAtIndexFunction = references.map(p => p.findParent(x => x.isFunctionDeclaration()))
                    .find(p => p && getCode(p).match(RegexStorage.GetStringAtIndex));
                    lookup.getAtIndexNumber = Number(getCode(lookup.getAtIndexFunction).match(RegexStorage.GetStringAtIndex)[1]);
                }
            }
        });

        let lookupIndex = generateLookupIndex(lookup);
        const lookupFunctionName = lookup.getAtIndexFunction.node.id.name;
        const lookupFunctionReferences = lookup.getAtIndexFunction.scope.getBinding(lookupFunctionName).referencePaths;
        const lookupFunctionAssigments = lookupFunctionReferences.filter(v=>v.parentPath.isAssignmentExpression());
        lookupFunctionAssigments.forEach(p => deobfuscateAssignment(p.parentPath, lookupIndex));

        cleanupDeadcode(lookup);
        replaceComputedProperties(ast);

        const minified = babel.transformFromAstSync(ast, null, {
            generatorOpts: {
                compact: true, 
            }
        }).code;

        var [_, numberParam, stringParam ] = minified.match(RegexStorage.EncodeParams);

        var [_, cf_cv_Object] = html.match(RegexStorage.CF_CV_Params);
        cf_cv_Object = JSONParse(cf_cv_Object);
        var [_, xkKZ4_Object] = minified.match(RegexStorage.CF_CHL_Options);
        xkKZ4_Object = JSONParse(xkKZ4_Object);
        var [_, xkKZ4, sArg, tArg, cf_cvparam] = minified.match(RegexStorage.OneshotURL);

        var [_, cf_cvtime] = minified.match(RegexStorage.CF_CV_Time);
        let t_time = Math.floor(Number(atob(cf_cv_Object[cf_cvtime])));

        let payload = JSON.stringify(getPayload(t_time, url, this.clientInformation));
        let compressedPayload = compressPayload(payload, Number(numberParam), stringParam);
        let oneshotURL = `https://${urlClassed.host}/cdn-cgi/challenge-platform/h/${xkKZ4_Object[xkKZ4]}/jsd/oneshot/${sArg}/${tArg}/${cf_cv_Object[cf_cvparam]}`;

        const onseshot = await this.browserFetch(oneshotURL, { body: compressedPayload, headers: extraHeaders_post, method: "POST" });
        if(!onseshot?.cookies?.cf_clearance) throw new Error("response doesnt contain cf_clearance");

        return onseshot.cookies.cf_clearance;
    }
}

module.exports = { CloudflareJSDSolver, clientFetch }