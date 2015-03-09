//"use strict";

// @TODO: update bookmark
// @TODO: keywords hängen sich immer in der Datenbank fest, sobald ein lesezeichen gespeichert wurde
// @TODO: navigation in mobile view

$(document).ready(function() {
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

    /**
     * Handle hoodie actions on page load
     * Must be called after hoodie initialization
     */
    // Account
    hoodie.account.on('signin', initializeBookmarks);
    hoodie.account.on('signout', bookmarks.clear);
    hoodie.account.on('signout', resetFilter);

    // Global store
    hoodie.global.on('bookmark:add', bookmarks.add);
    hoodie.global.on('bookmark:remove', bookmarks.remove);
});
