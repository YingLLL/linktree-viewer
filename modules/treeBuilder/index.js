const requestModule = require('../request');
const axiosModule = require('../axios');
const Url = require('url');
const Task = require('./Task');
const cheerio = require('cheerio');
const generateRandomString = (length) => Array.from({ length }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');
let taskQueue = [];
const allowedTasks = 10;
let _puppeteer;

const init = (puppeteer) => {
    _puppeteer = puppeteer;
}

const buildLinkTree = async (task, targetUrl, currentDepth) => {
    let linkTree = {
        title: targetUrl,
        children: [],
        folder: false
    }
    try {
        if (currentDepth < task.depth) {
            let result;
            switch (task.extraction_type) {
                case 'request':
                    result = await requestModule.scrapeContent(task, targetUrl);
                    break;
                case 'axios':
                    result = await axiosModule.scrapeContent(task, targetUrl);
                    break;
                case 'puppeteer':
                    result = await _puppeteer.scrapeContent(task, targetUrl);
                    break;
                default:
                    result = await requestModule.scrapeContent(task, targetUrl);
            }
            if (!result.err && result.html) {
                let $ = cheerio.load(result.html);
                // construct list of urls from current page
                let urls = [];
                $('a').each((index, link) => {
                    let _href = $(link).attr('href');
                    if (_href && _href.trim().length > 0) {
                        let _url = Url.resolve(targetUrl, _href);
                        if (!task.linktree_urls.includes(_url) && task.checkDomain(_url, task.include_domains)) {
                            urls.push(_url);
                            task.linktree_urls.push(_url)
                        }
                    }
                })
                urls = [...new Set(urls)];

                const promises = urls.map(async (url) => {
                    let innerLinkTree = await buildLinkTree(task, url, currentDepth + 1);
                    linkTree.children.push(innerLinkTree);
                })
                await Promise.all(promises);
                if (linkTree.children.length > 0) linkTree.folder = true;
            }
            else {
                console.log('err in result:', result.message ? result.message : result.err)
            }
        }
    }
    catch (e) {
        console.log('Error building linktree:', e);
    }
    return linkTree;
}


const accessQueue = async (params) => {
    if (taskQueue.length < allowedTasks) {
        const taskID = generateRandomString(10);
        let task = new Task({taskID: taskID, ...params});
        taskQueue.push(task);
        let indexTree = await buildLinkTree(task, task.url, 0);
        taskQueue = taskQueue.filter(task => task.taskID !== taskID);
        return { error: false, status: 'Success', linktreeBuilt: true, linktree: indexTree };
    }
    else {
        return { error: true, message: "Queue is full Please try after sometime" };
    }
}

module.exports = {
    init,
    accessQueue
};