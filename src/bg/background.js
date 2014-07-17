document.addEventListener('DOMContentLoaded', function(e) {
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
        console.log(token);
    });

    create_contextmenus();

    chrome.commands.onCommand.addListener(function(commad) {
        console.log('Command:', commnad);
    });
}, false);

chrome.alarms.create("later_check", {"periodInMinutes": 15});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name == "later_check") {
        later_check();
    }
});

chrome.runtime.onMessage.addListener(function(req, sender, callback) {
    // if (sender.tab) {
    if (req.text != undefined && req.id != undefined) {
        parseData(req.text, req.id);
    }
    // }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var id = tabId;
    if (changeInfo.status == 'complete') {
        chrome.tabs.getSelected(function(tab) {
            if (/^https?\:\/\/mail\.google\.com\/.*\/([0-9a-z]{16})$/.test(tab.url)) {
                chrome.contextMenus.update('parent', {enabled: true});
                chrome.pageAction.show(id);
                gmail_last_threadId(RegExp.$1);
            } else {
                chrome.contextMenus.update('parent', {enabled: false});
                chrome.pageAction.hide(id);
            }
        });
    }
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    var id = info.menuItemId;
    var threadId = tab.url.replace(/^.*\/([a-z0-9]+)$/, "$1");

    if (id == 'main') {
        show_input_dialog(threadId);
    } else if (id == '1days') {
        parseData('+1', threadId);
    } else if (id == '1weeks') {
        parseData('+1w', threadId);
    } else if (id == '10days') {
        parseData('+10', threadId);
    } else if (id == '1months') {
        parseData('+1m', threadId);
    } else if (id == 'list') {
        var url = chrome.runtime.getURL('') + 'src/options/index.html';
        chrome.tabs.create({url: url});
    }

});
