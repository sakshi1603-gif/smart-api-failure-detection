const logHealthCheck = (apiName, result) => {
  const statusText = result.success ? "OK" : "FAIL";
  console.log(
    `${apiName} → ${result.responseTime}ms → ${result.statusCode} ${statusText}`
  );
};

module.exports = logHealthCheck;