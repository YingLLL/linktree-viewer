const axios = require('axios');

const scrapeContent = async (task, targetUrl) => {
    try {
        let options = {
            url: targetUrl,
            method: 'GET',
            responseType: 'text'
        };
        if (task.useragent) {
            let userAgent = task.useragent_str && task.useragent_str.length > 0 ? task.useragent_str : "Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36";
            options['headers'] = { 'User-Agent': userAgent };
        }
        return new Promise((resolve, reject) => {
            axios(options)
                .then((response) => {
                    (response.status === 200) ? resolve({ err: false, html: response.data }) : resolve({ err: true, message: "Unable To retrive Content !!!" });
                })
                .catch((error) => {
                    console.log("Error In Axios:", error.message);
                    resolve({ err: true, message: error.message });
                })
        })
    }
    catch (e) {
        return { err: true, message: e.message };
    }
}

module.exports = {
    scrapeContent
}