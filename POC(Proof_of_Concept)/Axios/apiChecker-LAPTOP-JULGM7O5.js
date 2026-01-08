const axios = require("axios");

async function axiosunderstand(url) {
    try {
        const response = await axios({
            method: "get",
            url: url
        });

        console.log("url ->", url, "status ->", response.status);

    } catch (err) {
        console.log("Error:", err.message);
    }
}

axiosunderstand("https://jsonplaceholder.typicode.com/posts/1");




//project requires 

const axios = require("axios");

async function axiosUnderstand(url) {
    const start = Date.now();

    try {
        const response = await axios({
            method: "get",
            url: url,
            timeout: 3000
        });

        const latency = Date.now() - start;

        console.log({
            url,
            status: response.status,
            latency,
            healthy: true
        });

    } catch (err) {
        const latency = Date.now() - start;

        console.log({
            url,
            status: err.response?.status || "NO_RESPONSE",
            latency,
            healthy: false
        });
    }
}

axiosUnderstand("https://jsonplaceholder.typicode.com/posts/1");
