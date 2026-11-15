const axios = require("axios");
const {
  assertPublicHost,
  httpAgent,
  httpsAgent,
} = require("../utils/ssrfGuard");

const TIMEOUT = 5000;
const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT", "ERR_CANCELED"]);

// Redirect failures arrive wrapped (AxiosError -> RedirectionError -> ours).
function isSsrf(err) {
  for (let e = err, i = 0; e && i < 4; e = e.cause, i++) {
    if (e.code === "SSRF_BLOCKED") return true;
  }
  return false;
}

// Never throws. Always returns { statusCode, responseTime, timedOut, errorCode }.
// GET only, on purpose: monitoring must never mutate the target.
async function checkApi(api) {
  const start = Date.now();
  try {
    assertPublicHost(new URL(api.url).hostname);

    const res = await axios.get(api.url, {
      timeout: TIMEOUT,
      signal: AbortSignal.timeout(TIMEOUT), // also covers DNS stalls
      maxRedirects: 3,
      validateStatus: () => true, // we classify status ourselves
      responseType: "stream", // don't download or keep the body
      httpAgent,
      httpsAgent,
      beforeRedirect: (opts) => assertPublicHost(opts.hostname),
    });

    const responseTime = Date.now() - start;
    res.data.destroy();
    return {
      statusCode: res.status,
      responseTime,
      timedOut: false,
      errorCode: null,
    };
  } catch (err) {
    const ssrf = isSsrf(err);
    return {
      statusCode: err.response?.status || 0,
      responseTime: Date.now() - start,
      timedOut: TIMEOUT_CODES.has(err.code),
      errorCode: ssrf ? "SSRF_BLOCKED" : err.code || err.name || "UNKNOWN",
    };
  }
}

module.exports = { checkApi, TIMEOUT };
