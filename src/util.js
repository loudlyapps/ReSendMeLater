// Gmailの最後に開いたThreadのID
function gmail_last_threadId(threadId) {
    if (threadId) {
        localStorage['gmail_threadId'] = threadId;
    } else {
        return localStorage['gmail_threadId'];
    }
}

function get_data(cb) {
    chrome.storage.sync.get(["laterData"], function(result) {
        if (result.laterData == undefined) { result.laterData = []; }
        if (typeof cb == "function" ) { cb(result); }
    });
}

function add_data(data) {
    get_data(function(result) {
        var laterData = result.laterData;
        var add = false;
        for (var i in laterData) {
            if (laterData[i].id == data.id) {
                laterData[i] = data;
                add = true;
            }
        }
        if (!add) {
            result.laterData.push(data);
        }
        chrome.storage.sync.set({laterData: result.laterData}, function() {
            var message = '';
            message += 'Added threadId: ' + data.id;
            if (message) { message += ' with message ' + data.message; };
            message += ' at ' + data.date;
            notification(message);
        });
    });
}

function set_data(data) {
    chrome.storage.sync.set({laterData: data}, function() {
        console.log('set data:');
        console.log(data);
    });
}

function del_data(id) {
    get_data(function(result) {
        var laterData = result.laterData;
        var data = [];
        for (var i in laterData) {
            if (laterData[i].id != id) {
                data.push(laterData[i]);
            }
        }
        set_data(data);
    });
}

function clear_complete() {
    get_data(function(result) {
        var laterData = result.laterData;
        var data = [];
        for (var i in laterData) {
            if (laterData[i]['isActive'] == 't') {
                data.push(laterData[i]);
            }
        }
        set_data(data);
    });
}

function add_zero(str, length) {
    for (var i=0; i<length; i++) {
        str = '0' + str;
    }
    return str.substr(length * -1, length);
}

function later_check() {
    get_data(function(result) {
        var today = new XDate();
        var t = today.toString('yyyy/MM/dd');
        var data = result.laterData;

        var item = [];
        for (var i in data) {
            var d = data[i];
            if (t >= d["date"] && d["isActive"] == 't') {
                item.push(d);
                resend(d, resended);
            }
        }
        console.log(item);
    });
}

function send_newmail(url, token, item) {
    var mail = "";
    mail += "From: ReSendMeLater\n";
    mail += "\n";
    mail += unescape(encodeURIComponent(item.message)) + "\n";

    var newMail = new XMLHttpRequest();
    newMail.open('POST', url + 'messages');
    newMail.setRequestHeader('Authorization', 'Bearer ' + token);
    newMail.setRequestHeader('Content-Type', 'application/json');
    newMail.send(JSON.stringify(
        {
            threadId: item.id,
            raw: btoa(mail)
        }
    ));
    newMail.onreadystatechange = function() {
        if (newMail.readyState == 4 && newMail.status == 200) {
            console.log(newMail);
        }
    };
}

function unread_message(url, token, item, thread, cb) {
    var messages = JSON.parse(thread.responseText).messages;
    var messageid = messages[messages.length - 1].id;
    console.log(messageid);

    var message = new XMLHttpRequest();
    message.open('POST', url + 'messages/' + messageid + '/modify');
    message.setRequestHeader('Authorization', 'Bearer ' + token);
    message.setRequestHeader('Content-Type', 'application/json');
    message.send(JSON.stringify({"addLabelIds":["UNREAD","INBOX"]}));
    message.onreadystatechange = function() {
        if (message.readyState == 4 && message.status == 200) {
            console.log(message);
            cb(item.id);
        }
    };
}

function get_snippet(threadId, cb) {
    chrome.identity.getAuthToken({ "interactive": true }, function(token) {
        var url = 'https://www.googleapis.com/gmail/v1/users/me/';
        var thread = new XMLHttpRequest();
        thread.open('GET', url + 'threads/' + threadId);
        thread.setRequestHeader('Authorization', 'Bearer ' + token);
        thread.send();
        thread.onreadystatechange = function() {
            if (thread.readyState == 4 && thread.status == 200) {
                console.log(JSON.parse(thread.responseText));
                var mail = JSON.parse(thread.responseText).messages[0];
                var headers = mail.payload.headers;
                var subject, from;
                for (var i in headers) {
                    if (headers[i].name == 'Subject') {
                        subject = headers[i].value;
                    }
                    if (headers[i].name == 'From') {
                        from = headers[i].value;
                    }
                    if (subject && from) {
                        continue;
                    }
                }
                cb(threadId, subject, from);
            }
        };
    });
}

function resend(item, cb) {
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
        var url = 'https://www.googleapis.com/gmail/v1/users/me/';
        var thread = new XMLHttpRequest();
        thread.open('GET', url + 'threads/' + item.id);
        thread.setRequestHeader('Authorization', 'Bearer ' + token);
        thread.send();
        thread.onreadystatechange = function() {
            if (thread.readyState == 4 && thread.status == 200) {
                unread_message(url, token, item, thread, cb);
            }
        };
        send_newmail(url, token, item);
    });
}

function resended(id) {
    get_data(function(result) {
        var data = result.laterData;
        for (var i in data) {
            if (id == data[i]["id"]) {
                data[i]["isActive"] = 'f';
                // item.push(data[i]);
            }
        }
        set_data(data);
    });
}

function build_dialog() {

    var logo = $('<img>')
            .css('float', 'left')
            .attr('src', chrome.extension.getURL('icons/icon38.png'));

    var title = $('<div>').text('ReSendMeLater')
            .css({
                'margin': '5px',
                'font-size': '18pt'
            });

    var cancel = $('<div>').text('cancel')
            .css({
                'cursor': 'pointer',
                'padding-top': '8px',
                'float': 'right',
                'margin-right': '10px'
            })
            .click(function() {
                $('#ReSendMeLaterInput').val('').change();
                document.querySelector('#ReSendMeLaterDialog').close();
            });

    var add = $('<input type="submit">').val('Add')
            .attr({
                'id': 'ReSendMeLaterSubmit',
                'role': 'button',
                'disabled': 'disabled',
                'type': 'submit',
                'tabIndex': '0'
            })
            .css({
                'padding': '6px 12px',
                'color': '#fff',
                'text-align': 'center',
                'border-radius': '4px',
                'float': 'right',
                'background': '#428bca',
                'border-color': '#357cbd',
                'opacity': '.65',
                'display': 'block',
                'border': '1px solid transparent'
            })
            .hover(
                function() {
                    if ($('#ReSendMeLaterSubmit').attr('disabled') != 'disabled') {
                        $(this).css({
                            'background': '#3071a9',
                            'border-color': '#285e8e'
                        });
                    }
                },
                function() {
                    $(this).css({
                        background: '#428bca',
                        'border-color': '#357cbd'
                    });
                }
            );

    var button = $('<div>').append(add).append(cancel);

    var input_change = function(val) {
        if (/^\d{4}\/\d{2}\/\d{2}/.test(str2date(val.split(' ')[0]))) {
            $('#ReSendMeLaterSubmit')
                .css('opacity', 1.0)
                .removeAttr('disabled');
        } else {
            $('#ReSendMeLaterSubmit')
                .css('opacity', '.65')
                .attr('disabled', 'disabled');
        }
    };
    var input = $('<input type="text">')
            .attr({
                'id': 'ReSendMeLaterInput',
                'placeholder': '2014/8/5 息子の誕生日プレゼント候補'
            })
            .css({
                'font-family': 'arial,sans-serif',
                'margin': '10px',
                'width': '350px',
                'padding': "10px",
                'border': "1px solid silver"
            })
            .change(function() {
                input_change($(this).val());
            })
            .keyup(function(e) {
                if (e.which == 27) {
                    document.querySelector('#ReSendMeLaterDialog').close();
                } else {
                    input_change($(this).val());
                }
            });

    var dialog = $('<dialog>', { id: 'ReSendMeLaterDialog' })
            .css({
                'padding': '1em',
                'width': '400px',
                'font-size': '12pt',
                'font-family': 'trebuchet MS',
                'border': '1px solid rgba(0, 0, 0, 0.3)',
                'border-radius': '3px',
                'box-shadow': '0 3px 7px rgba(0, 0, 0, 0.3)',
                'background': 'rgba(255,255,255,0.98)'
            }).append(logo).append(title).append(input).append(button);

    return dialog;
}

function clear_storage() {
    chrome.storage.sync.clear();
}

function display_storage() {
    chrome.storage.sync.get(["laterData"], function(result) {
        console.log(result);
    });
}

function show_input_dialog(threadId, str) {
    var dialog = document.querySelector('#ReSendMeLaterDialog');
    if (str) { $('#ReSendMeLaterInput').val(str); }
    $('#ReSendMeLaterSubmit').click(function() {
        var id = (threadId || location.href.replace(/^.*\/([a-z0-9]+)$/, "$1"));
        var result = $('#ReSendMeLaterInput').val();
        if (threadId) {
            parseData(result, id);
        } else {
            chrome.extension.sendMessage({text: result, id: id}, function(response) {});
        }
        dialog.close();
    });
    dialog.showModal();
}

function parseData(text, id) {
    var d = text.split(/\s/);
    var date = str2date(d[0]);
    var message = d[1];

    if (date) {
        add_data({date: date, message: message, id: id, isActive: 't'});
    }
}

function str2date(str) {
    var date = undefined;
    var today = new XDate();

    // yyyy/mm/dd
    if (/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.test(str)) {
        date = RegExp.$1 + "/" + RegExp.$2 + "/" + RegExp.$3;
    }

    // yyyy/mm
    else if (/^(\d{4})\/(\d{1,2})$/.test(str)) {
        date = RegExp.$1 + "/" + RegExp.$2 + '/01'; // TODO: 過去日は弾いた方がいい？
    }

    // dd next mm/dd
    else if (/^(\d{1,2})\/(\d{1,2})$/.test(str)) {
        var m = RegExp.$1;
        var d = RegExp.$2;
        if ((m * 100 + d * 1) > today.toString('MMdd') * 1) {
            date = today.getFullYear() + "/" + m + "/" + d;
        } else {
            date = (today.getFullYear() * 1 + 1) + "/" + m + "/" + d;
        }
    }

    // dd next dd
    else if (/^(\d{1,2})$/.test(str)) {
        var d = RegExp.$1;
        if (d > today.toString('dd') * 1) {
            date = today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + d;
        } else {
            var next = today.addMonths(1);
            date = next.getFullYear() + "/" + (next.getMonth() + 1) + "/" + d;
        }
    }

    // +N N day
    else if (/^\+(\d+)$/.test(str)) {
        date = today.addDays(RegExp.$1).toString('yyyy/MM/dd');
    }

    // +Nw N week
    else if (/^\+(\d+)[wW]$/.test(str)) {
        date = today.addWeeks(RegExp.$1).toString('yyyy/MM/dd');

    }

    // +Nw N month
    else if (/^\+(\d+)[mM]$/.test(str)) {
        date = today.addMonths(RegExp.$1).toString('yyyy/MM/dd');
    }


    if (date != undefined && /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.test(date)) {
        date = RegExp.$1 + "/" + add_zero(RegExp.$2, 2) + "/" + add_zero(RegExp.$3, 2);
    }

    return date;
}

function create_contextmenus() {
    chrome.contextMenus.create({
        title: "ReSendMeLater",
        id: 'parent',
        enabled: false
    });
    chrome.contextMenus.create({
        title: "Show dialog",
        parentId: 'parent',
        id: 'main'
    });
    chrome.contextMenus.create({
        parentId: 'parent',
        type: 'separator',
        id: 'line1'
    });
    chrome.contextMenus.create({
        title: "Later +1 days",
        parentId: 'parent',
        id: '1days'
    });
    chrome.contextMenus.create({
        title: "Later +1 weeks",
        parentId: 'parent',
        id: '1weeks'
    });
    chrome.contextMenus.create({
        title: "Later +10 days",
        parentId: 'parent',
        id: '10days'
    });
    chrome.contextMenus.create({
        title: "Later +1 months",
        parentId: 'parent',
        id: '1months'
    });
    chrome.contextMenus.create({
        parentId: 'parent',
        type: 'separator',
        id: 'line2'
    });
    chrome.contextMenus.create({
        title: 'Later list',
        parentId: 'parent',
        id: 'list'
    });
}

function notification(message) {
    chrome.notifications.create('ReSendMeLater', {
        type: 'basic',
        title: 'ReSendMeLater',
        iconUrl: chrome.extension.getURL('icons/icon128.png'),
        message: message
    }, function(id) { console.log('notif'); });
}
