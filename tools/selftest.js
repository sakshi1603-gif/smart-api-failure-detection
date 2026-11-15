const { checkApi } = require("../backend/services/checkApi.service");
const { classifyCheck } = require("../backend/services/failureDetector.service");
const B = "http://127.0.0.1:4000";
const cases = [
  ["ok", `${B}/ok`], ["404", `${B}/404`], ["500", `${B}/500`],
  ["slow 1500ms (sla 1000)", `${B}/slow?ms=1500`], ["hang", `${B}/hang`],
  ["redirect-ok", `${B}/redirect-ok`], ["redirect->metadata", `${B}/redirect-metadata`],
  ["dead domain", "http://does-not-exist-xyz123.invalid"],
  ["metadata IP", "http://169.254.169.254/latest/meta-data/"],
  ["192.168 literal", "http://192.168.1.1/"], ["decimal 127", "http://2130706433/ok"],
  ["localhost", "http://localhost:4000/ok"],
];
(async () => {
  for (const [name, url] of cases) {
    const r = await checkApi({ url });
    const c = classifyCheck(r, 1000);
    console.log(name.padEnd(24), String(r.statusCode).padEnd(4), String(r.errorCode).padEnd(16), `${r.responseTime}ms`.padEnd(8), c.healthStatus, c.failureType);
  }
  process.exit(0);
})();
