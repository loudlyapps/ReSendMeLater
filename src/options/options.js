var clear_complete_flg = false; // TODO: 他の方法を考える

document.addEventListener('DOMContentLoaded', function() {
    get_data(active_check);
    $('#clear_complete').click(function() {
        $('#active_list').html('');
        $('#progress').show();
        $('.nav-tabs a:first').tab('show');
        clear_complete();
        clear_complete_flg = true;
        get_data(active_check);
        $('#complete_list').html('');
     });
});

function active_check(data, type) {
    console.log(data);
    var laterData = data["laterData"];
    var active = [];
    var complete = [];
    for (var i in laterData) {
        var d = laterData[i];
        if (d.isActive == 't') {
            active.push(d);
        } else {
            complete.push(d);
        }
    }



    console.log(complete);
    render(active, 'active');
    if (clear_complete_flg == false) {
        render(complete, 'complete');
    }
    clear_complete_flg = false;
}

function render(laterData, area) {

    laterData.sort(function(a, b) {
        var x = a.date;
        var y = b.date;
        if (x > y) return 1;
        if (x < y) return -1;
        return 0;
    });

    var table = $('<div>');

    for (var i in laterData) {
        var d = laterData[i];

        get_snippet(d.id, function(id, subject, from) {

            var a = $('<a>', {
                href: "https://mail.google.com/mail/#inbox/" + id,
                text: subject
            });
            console.log(a);
            $('#subject' + id).append(a);
            $('#from' + id).text(from);
            $('#' + id).show();
            $('#progress').hide();
        });

        var item = $('<div>', {
            id: d.id,
            class: 'item'
        }).css('display', 'none');



        if (d.isActive == 'f') {
            console.log('isNotActive');
            $('#subject' + d.id).addClass('strike');
            var isActive = (d.isActive == 'f')? 'notactive': 'active';
        }
        var subject = $('<div>', {
            id: 'subject' + d.id,
            class: 'subject ' + isActive
        }).appendTo(item);

        var from = $('<div>', {
            id: 'from' + d.id,
            class: 'from'
        }).appendTo(item);

        var date = $('<div>', {
            class: 'date',
            text: 'ReSend: ' + d.date
        }).appendTo(item).click(function() {
            var str = d.date + ' ' + d.message;
            show_input_dialog(d.id, str);
        });

        if (d.message) {
            var line = $('<hr>', {
                class: 'messageline'
            }).appendTo(item);
        }

        var message = $('<div>', {
            class: 'message',
            text: d.message
        }).appendTo(item).click({args: d}, function(eo) {
            var d = eo.data.args;
            var str = d.date + ' ' + d.message;
            show_input_dialog(d.id, str);
        });

        item.appendTo(table);

    }
    $('#' + area + '_list').append(table);

}
