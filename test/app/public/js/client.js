/*globals $, document */
$(function () {
    $('.item').wrapInner(function () {
        var link = $('<a/>');
        link.attr('href', '/authors/' + $(this).attr('id'));
        return link;
    });
});

