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

    $('#date').change(function(e) {
        console.log($('#date').val());
        var date = $('#date').val().replace(/\-/g, '/');
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
            $('#submit').removeClass('disabled');
            console.log($('#date').val());
        }
    });
});
