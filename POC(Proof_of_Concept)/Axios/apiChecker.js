const axios=require("axios");

async function axiosuderstand(url){
    try{
        const response =await axios({
        method:"get",
        url:url
    })
    console.log("url ->",url, "status", response.status, )
    }catch(err){
        console.log(err);
    }
}
axiosUnderstand("https://jsonplaceholder.typicode.com/posts/1");
