class Task {
    linkTreeUrls = [];
    constructor({
        taskID,
        url,
        include_domains,
        extraction_type,
        use_puppeteer_extra,
        proxy,
        proxy_ip,
        proxy_auth,
        useragent,
        useragent_str,
        timeout,
        depth
    }) {
        this.taskID = taskID;
        this.url = url;
        this.include_domains = include_domains;
        this.extraction_type = extraction_type;
        this.use_puppeteer_extra = use_puppeteer_extra;
        this.proxy = proxy;
        this.proxy_ip = proxy_ip;
        this.proxy_auth = proxy_auth;
        this.useragent = useragent;
        this.useragent_str = useragent_str;
        this.timeout = timeout;
        this.depth = depth;
    }

    checkDomain(_url) {
        if (this.include_domains.length > 0) {
            let _result = false;
            this.include_domains.forEach((value) => {
                if (!_result && _url.indexOf(value.text) > -1) {
                    _result = true;
                }
            });
            return _result;
        }
        else return true;
    }
}

module.exports = Task;
