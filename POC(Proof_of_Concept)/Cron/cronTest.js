//Print a message automatically every 10 seconds

const cron=require("node-cron");

cron.schedule("* * * * * *",()=>{
    console.log("Cron is working 🚀", new Date().toLocaleTimeString())
})

// node cronTest.js

// to connect with the main file 
//require("./cron/monitor.cron");
// we only need to do this 
//it will automatically call the cron schedul 1st when backend starts then it calls the cron in the bagrouund 