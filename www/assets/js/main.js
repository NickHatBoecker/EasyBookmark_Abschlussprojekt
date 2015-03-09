//"use strict";

$(document).ready(function() {
    hoodie = new Hoodie();
    bookmarks = new Bookmarks($('#bookmarkWrapper'));

    bookmarkOrder = {
        attribute: 'created',
        direction: $('#sortDirection option:checked').val()
    };

    if (typeof hoodie.account.username == 'undefined') {
        $('body').addClass('not-logged-in');
        hoodie.account.on('signin', signIn);
    } else {
        $('body').addClass('logged-in');

        hoodie.account.on('signout', signOut);
        hoodie.global.on('bookmark:add', bookmarks.add);
        hoodie.global.on('bookmark:remove', bookmarks.remove);
    }
});
