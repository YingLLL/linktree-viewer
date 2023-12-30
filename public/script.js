// methods to help with resizing of containers
const $baseContainer = $("#baseContainer");
$baseContainer.resizable({
    resize: function (event, ui) {
        // dynamically resize component to allow autoscroll
        if ((ui.position.top + $(this).height() > $(window).height() - 160) && ($(".tree-content").height() + 100 < $(".fancytree-container").outerHeight())) {
            $(this).height($(this).height() + 5);
            setTimeout(function () {
                $(window).scrollTop($(this).prop("scrollHeight"));
            }.bind(this), 800);
        }
        resizeTreeContainer();
    }
});

const resizeContainer = document.getElementById('config-container');
const resizeObserver = new ResizeObserver(entries => {
    resizeTreeContainer();
    resizeBaseContainer();
});
resizeObserver.observe(resizeContainer);

function resizeTreeContainer() {
    let treeContainerSpace = $("#baseContainer").height() - ($("#page-title").height() + 8) - $("#ExtractionForm").height();
    $("#tree-container").outerHeight(treeContainerSpace);
    $(".tree-content").outerHeight($("#tree-container").height() - 10);
}

function resizeBaseContainer() {
    let sumContentHeight = ($("#page-title").height() + 8) + $("#ExtractionForm").height();
    $baseContainer.resizable('option', 'minHeight', sumContentHeight + 140);
    $baseContainer.height(sumContentHeight + $(".tree-content").outerHeight() + 40);
}

// Event listeners/handlers for enabling the submit button when input is valid
const submitButton = document.getElementById('submitButton');
let urlInput = document.getElementById('urlInput');
let proxyAddressInput = document.getElementById('proxyAddress');

function urlInputEventHandler() {
    submitButton.disabled = !urlInput.checkValidity();
}

function combinedInputEventHandler() {
    submitButton.disabled = !proxyAddressInput.checkValidity() || !urlInput.checkValidity();
}
urlInput.addEventListener('input', urlInputEventHandler);

$("#extractionType").change(function () {
    if ($(this).val() === "puppeteer") {
        $("#puppeteerExtraContainer").show();
        $('#proxyContainer').show();
        resizeBaseContainer();
    } else {
        $("#puppeteerExtraContainer").hide();
        $('#proxyContainer').hide();
        $('input[name="enableProxy"][value="false"]').prop('checked', true).trigger('change');
        resizeBaseContainer();
    }
})

$("input[name='enableProxy']").change(function () {
    if ($(this).val() === 'true') {
        document.getElementById('proxyAddress').required = true;
        $("#proxyAddressContainer").show();
        $('#submitButton').prop('disabled', !proxyAddressInput.checkValidity() || !urlInput.checkValidity());
        urlInput.removeEventListener('input', urlInputEventHandler);
        urlInput.addEventListener('input', combinedInputEventHandler);
        proxyAddressInput.addEventListener('input', combinedInputEventHandler);
        resizeBaseContainer();
    } else {
        document.getElementById('proxyAddress').required = false;
        $("#proxyAddressContainer").hide();
        submitButton.disabled = !urlInput.checkValidity();
        proxyAddressInput.removeEventListener('input', combinedInputEventHandler);
        urlInput.removeEventListener('input', combinedInputEventHandler);
        urlInput.addEventListener('input', urlInputEventHandler);
        resizeBaseContainer();
    }
});

$("input[name='enableUseragent']").change(function () {
    $(this).val() === 'true' ? $("#useragentContainer").show() : $("#useragentContainer").hide();
    resizeBaseContainer();
});

// helper methods for building linktree
const taggedInput = document.querySelector('input.tagify');
const tagify = new Tagify(taggedInput, {
    classNames: {
        container: 'tagify-container'
    }
})

function toggleGetChildrenBtn() {
    let tree = $.ui.fancytree.getTree("#tree");
    let atLeastOneNodeSelected = tree.getSelectedNodes().length > 0;
    $("#getChildrenBtn").prop("disabled", !atLeastOneNodeSelected);
}

function checkDuplicates(childrenNodes) {
    let tree = $.ui.fancytree.getTree("#tree");
    let allTitles = new Set();
    tree.visit(node => allTitles.add(node.title));
    let nodesToAdd = childrenNodes.filter(node => !allTitles.has(node.title));
    return nodesToAdd;
}

async function getLinktree(params) {
    try {
        const response = await fetch('/getLinktree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': 'ZYDObSNLYWsISl1jNr3J2vT7t7xZBH'
            },
            body: JSON.stringify(params)
        });
        const data = await response.json();
        return data;
    }
    catch (e) {
        console.log('Error fetching linktree:', e);
        return { error: true, linktree: { title: params.url, children: [{ title: "[x] failed to get linktree", children: [] }], folder: true } };
    }
}

function getTreeList() {
    let tree = $.ui.fancytree.getTree("#tree");
    let nodeTitles = [];
    if (tree) {
        tree.visit((node) => {
            nodeTitles.push(node.title);
        });
    }
    return nodeTitles;
}

function buildParams(targetUrl) {
    let params = {
        url: targetUrl,
        include_domains: tagify.value.map(tag => { return { text: tag.value } }),
        extraction_type: document.getElementById('extractionType').value,
        use_puppeteer_extra: JSON.parse($('input[name="enablePuppeteerExtra"]:checked').val()),
        proxy: JSON.parse($('input[name="enableProxy"]:checked').val()),
        proxy_ip: document.getElementById('proxyAddress').value,
        proxy_auth: JSON.parse($('input[name="enableProxyAuth"]:checked').val()),
        useragent: JSON.parse($('input[name="enableUseragent"]:checked').val()),
        useragent_str: document.getElementById('useragent').value,
        timeout: parseInt(document.getElementById('timeout').value),
        depth: parseInt(document.getElementById('depth').value),
        linktree_urls: getTreeList()
    }
    return params;
}

async function validateForm(event) {
    event.preventDefault();
    const urlInput = document.getElementById('urlInput');
    if (!urlInput.checkValidity()) {
        console.log('Invalid URL. Please enter a valid URL.');
    } else {
        // destroy current linktree
        let tree = $.ui.fancytree.getTree("#tree");
        if (tree) tree.destroy();

        const loader = document.getElementById('loader');
        loader.style.display = 'block';
        document.querySelector('.tree-content').hidden = true;

        try {
            let params = buildParams(urlInput.value);
            let data = await getLinktree(params);
            loader.style.display = 'none';
            document.querySelector('.tree-content').hidden = false;
            $("#tree").fancytree({
                // Fancytree configuration options
                extensions: ["glyph"],
                checkbox: true,
                clickFolderMode: 2,
                checkboxAutoHide: true,
                glyph: {
                    preset: "awesome5",
                    map: {
                        doc: "fas fa-regular fa-link",
                        folder: "fas fa-solid fa-list",
                        folderOpen: "fas fa-solid fa-list"
                    }
                },
                source: [data.linktree],
                select: function (event, data) {
                    toggleGetChildrenBtn();
                },
                createNode: function (event, data) {
                    if (isStylesToggled) data.node.li.classList.add("connectors");
                },
                click: function (event, data) {
                    if (data.node.title) copyToClipboard(data.node.title);
                }
            });
        }
        catch (e) {
            console.log('Get linktree error:', e)
        }
    }
}

// Event listener to build sub linktrees
$("#getChildrenBtn").on("click", function () {
    let tree = $.ui.fancytree.getTree("#tree");
    var selectedNodes = tree.getSelectedNodes();
    // Loop through selected nodes and send requests
    selectedNodes.forEach(async function (node) {
        node.setSelected(false);
        node.setStatus('loading')
        let params = buildParams(node.title);
        let data = await getLinktree(params);
        if (data.error) {
            node.setStatus('error', data.message)
        } else {
            let childsToAdd = checkDuplicates(data.linktree.children);
            if (childsToAdd.length > 0) {
                node.folder = true;
                node.setExpanded(false);
                node.addChildren(childsToAdd);
                node.render(true);
            }
            node.setStatus('ok');
        };
    });
});

var isStylesToggled = false;
function toggleCss() {
    const treeElement = document.getElementById('tree');
    const treeItems = treeElement.getElementsByTagName('li');
    isStylesToggled = !isStylesToggled;
    for (const item of treeItems) {
        if (isStylesToggled) {
            item.classList.add('connectors');
        } else {
            item.classList.remove('connectors');
        }
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(function () {
            $('.toast').toast('show')
        })
        .catch(function (err) {
            console.error('Unable to copy text to clipboard', err);
        });
}

$('.toast').toast({ animation: true, autohide: true });
