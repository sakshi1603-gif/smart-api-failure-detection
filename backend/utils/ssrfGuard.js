const dns = require("dns");
const http = require("http");
const https = require("https");
const net = require("net");

// Dev/test only: lets the local mock server (127.0.0.1) be monitored.
// Private ranges, link-local and cloud metadata stay blocked even when set.
const ALLOW_LOOPBACK = process.env.ALLOW_LOOPBACK_TARGETS === "true";

function blocked(msg) {
  const e = new Error(msg);
  e.code = "SSRF_BLOCKED";
  return e;
}

function isLoopback(ip) {
  return ip === "::1" || (net.isIPv4(ip) && ip.startsWith("127."));
}

function isBlockedIp(ip) {
  if (ALLOW_LOOPBACK && isLoopback(ip)) return false;

  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local + cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast / reserved
    );
  }

  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    if (v.startsWith("::ffff:")) {
      const m = v.slice(7);
      return net.isIPv4(m) ? isBlockedIp(m) : true; // hex form: block
    }
    return /^(fc|fd|fe[89ab])/.test(v); // ULA + link-local
  }

  return true; // unknown format: block
}

// Hostname-level check. Covers IP literals (they skip DNS lookup entirely)
// and is reused for every redirect hop.
function assertPublicHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    if (!ALLOW_LOOPBACK) throw blocked(`Blocked host ${host}`);
    return;
  }
  if (net.isIP(host) && isBlockedIp(host)) {
    throw blocked(`Blocked address ${host}`);
  }
}

// Connect-time check on the IPs actually used. Stops DNS names that
// resolve to private IPs, and DNS rebinding.
function safeLookup(hostname, options, cb) {
  if (typeof options === "function") {
    cb = options;
    options = {};
  }
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return cb(err);
    const bad = addrs.find((a) => isBlockedIp(a.address));
    if (bad) return cb(blocked(`Blocked address ${bad.address}`));
    if (options.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}

const httpAgent = new http.Agent({ lookup: safeLookup });
const httpsAgent = new https.Agent({ lookup: safeLookup });

module.exports = { assertPublicHost, isBlockedIp, httpAgent, httpsAgent };