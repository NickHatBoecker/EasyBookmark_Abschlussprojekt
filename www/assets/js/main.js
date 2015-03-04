//"use strict";

// @TODO: update bookmark

$(document).ready(function(){
    hoodie = new Hoodie();
    bookmarks = new Bookmarks($('#bookmarkWrapper'));

    bookmarkOrder = {
        attribute: 'created',
        direction: $('#sortDirection option:checked').val()
    };

    // initialize tagsinput
    $('.tagsinput').tagsinput();

    // initial load of all bookmark items from the store
    initializeBookmarks();

    // clear everything when user logs out,
    hoodie.account.on('signin', initializeBookmarks);
    hoodie.account.on('signout', bookmarks.clear);
    hoodie.account.on('signout', resetFilter);

    hoodie.global.on('bookmark:add', bookmarks.add);
    hoodie.global.on('bookmark:remove', bookmarks.remove);
});
