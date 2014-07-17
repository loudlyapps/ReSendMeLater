window.addEventListener('keyup', function(e) {
    var name = e.target.tagName;

    var isTextarea = (name == 'TEXTAREA')? true: false;
    var isInput = (name == 'INPUT')? true: false;
    var isContentEditablePlaintext = (e.target.contentEditable == 'plaintext-only')? true: false;
    var isContentEditable = (e.target.contentEditable == 'true')? true: false;
    if (isTextarea || isInput || isContentEditablePlaintext || isContentEditable) { return; }

    if (!/.*\/[0-9a-z]{16}$/.test(location.href)) { return; }

    if (e.keyCode == '186' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) { // keyCode186 is ':'
        show_input_dialog();
    }
}, false);
