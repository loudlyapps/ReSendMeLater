$(document).ready( function() {
    $('#submit').click(function(e) {
        $('#submit').addClass('disabled');
        var date = $('#date').val().replace(/\-/g, '/');
        var memo = $('#memo').val();
        chrome.runtime.getBackgroundPage(function(bp) {
            chrome.runtime.sendMessage({
                text: date + ' ' + (memo || ''),
                id: bp.gmail_last_threadId()
            });
            setTimeout(function() {
                window.opener = 'myself';
                window.close();
            }, 1000);
        })
        // chrome.runtime.sendMessage({
        //     text: date + ' ' + (memo || ''),
        //     id: chrome.extension.getBackgroundPage().gmail_last_threadId()
        // });
        // setTimeout(function() {
        //     window.opener = "myself";
        //     window.close();
        // }, 1000);
    });

    $('#datepicker').datepicker({
        format: 'yyyy/mm/dd',
        language: 'ja',
        todayHighlight: true,
        startDate: Date()
    }).on('changeDate', function(e) {
        var d = e['date'];
        var yyyy = d.getFullYear();
        var mm = add_zero(d.getMonth() + 1, 2);
        var dd = add_zero(d.getDate(), 2);
        $('#date').val(yyyy + '/' + mm + '/' + dd);
        $('#submit').removeClass('disabled');
    });
});
