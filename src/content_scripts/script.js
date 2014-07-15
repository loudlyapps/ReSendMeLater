window.addEventListener('keyup', function(e) {
    var name = e.target.tagName;
    if (name == 'TEXTAREA' || name == 'INPUT' || e.target.contentEditable == 'plaintext-only') { return; }

    if (!/.*\/[0-9a-z]{16}$/.test(location.href)) { return; }

    if (e.keyCode == '186' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) { // keyCode186 is ':'
        show_input_dialog();
    }
}, false);
