function isFrequentlySlow(logs, slowLimit = 4) {
  const slowCount = logs.filter(
    log => log.healthStatus === "SLOW"
  ).length;

  return slowCount >= slowLimit;
}


// 1)filter():
//         runs on an array
//         returns a new array
//         keeps only elements where condition is true

// 2)Arrow Function:
//             log => log.healthStatus === "SLOW"
// This is short for:

//         function(log) {
//           return log.healthStatus === "SLOW";
//         }
// Meaning:
//         “For each log, keep it only if its healthStatus is exactly "SLOW".”
// 3)Result of filter
// If:
//     logs = [SLOW, HEALTHY, SLOW, FAILED, SLOW]
// After filter:
//          [SLOW, SLOW, SLOW]
// 4)length
// Counts how many elements are in the filtered array.