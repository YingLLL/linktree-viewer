const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteerExtra.use(StealthPlugin());
let browser;
let puppeteerExtraBrowser;

const scrapeContent = async (task, targetUrl) => {
    try {
        if (task.proxy && task.proxy_ip) {
            if (task.use_puppeteer_extra) {
                try {
                    puppeteerExtraBrowser = await (puppeteerExtra.launch({
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
                        headless: true
                    }))
                    var page = await (puppeteerExtraBrowser.newPage());
                }
                catch (e) {
                    console.log(e);
                }
            }
            else {
                let s = '--proxy-server=' + task.proxy_ip;
                let args = ['--no-sandbox', '--disable-setuid-sandbox', s];
                try {
                    proxyBrowser = await (puppeteer.launch({
                        headless: true,
                        args: args,
                        ignoreHTTPSErrors: true
                    }));
                    var page = await (proxyBrowser.newPage());
                }
                catch (e) {
                    console.log(e);
                }
            }
            if (task.proxy_auth) {
                await (page.authenticate({ username: process.env.PROXY_USER, password: process.env.PROXY_PASS }));
            }
        }
        else {
            var page = await browser.newPage();
        }

        if (task.useragent) {
            let userAgent = task.useragent_str && task.useragent_str.length > 0 ?  task.useragent_str : "Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36";
            await page.setUserAgent(userAgent);
            await page.setExtraHTTPHeaders({ 'User-Agent': userAgent });
        }
        console.log("[navigating to] =>", targetUrl);
        try {
            await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: task.timeout * 1000 });
        } catch (e) {}

        let html = await (page.$eval('html', e => e.innerHTML));
        await page.close();
        if (task.proxy && task.proxy_ip) {
            task.use_puppeteer_extra ? await (puppeteerExtraBrowser.close()) : await (proxyBrowser.close());
        }
        return { err: false, html: html };
    }
    catch (e) {
        await page.close();
        if (task.proxy && task.proxy_ip) {
            if (task.use_puppeteer_extra) {
                await (puppeteerExtraBrowser.close());
            }
            else {
                await (proxyBrowser.close());
            }
        }
        console.log("[Puppeteer Error]", e);
        return { err: true, message: "Puppeteer error" };
    }
}

const launchBroswer = async () => {
    try {
        browser = await (puppeteer.launch({
            headless: true,
            slowMo: 250,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            ignoreHTTPSErrors: true
        }));
        browser.on('disconnected', () => {
            console.log("[x] Puppeteer disconnected!");
            init();
        });
    }
    catch (e) {
        console.log("[Error launching browser]", e);
        process.exit();
    }
}

const init = async () => {
    await launchBroswer();
    console.log('[+] Puppeteer initialised')
}

module.exports = {
    init,
    scrapeContent
};