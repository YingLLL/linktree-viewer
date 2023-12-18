const request = require('request');
var Url = require('url');

const scrapeContent = async (task, targetUrl) => {
    try {
        let options = {
            url: targetUrl
        };
        if (task.proxy) {
            if (task.proxy_auth) {
                let _parsedUrl = Url.parse(task.proxy_ip);
                options['proxy'] = (_parsedUrl) ? `${_parsedUrl.protocol}//${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${_parsedUrl.host}` : task.proxy_ip;
            }
            else {
                options['proxy'] = task.proxy_ip;
            }
        }
        if (task.useragent) {
            let userAgent = task.useragent_str && task.useragent_str.length > 0 ?  task.useragent_str : "Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36";
            options['headers'] = { 'User-Agent': userAgent };
        }
        return new Promise((resolve, reject) => {
            request.post(options, (error, response, html) => {
                (error || (response.statusCode && response.statusCode != 200)) ? reject({ err: true, message: error && error.message ? error.message : response.statusMessage }) : resolve({ err: false, html: html });
            });
        })
    }
    catch (e) {
        return { err: true, message: e.message };
    }
}

module.exports = {
    scrapeContent
}