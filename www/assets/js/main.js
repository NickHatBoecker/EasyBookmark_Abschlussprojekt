//"use strict";

// @TODO: update bookmark

$(document).ready(function(){
    hoodie = new Hoodie();
    bookmarks = new Bookmarks($('#bookmarkWrapper'));
    hoodieUrl = 'http://192.168.56.101:6001';

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

// handle creating / editing a new bookmark
$(document).on('click', '#bookmarkModal #saveSettings', function(event) {
    var bookmarkUrl        = $('#bookmarkUrl').val();
    var bookmarkId         = bookmarks.exists(bookmarkUrl);
    var bookmarkCreated    = new Date().getTime();
    var bookmarkKeywords   = $('#bookmarkKeywords').val().split(',');

    var bookmarkAuthor     = hoodie.account.username;
    var bookmark = {
        url: bookmarkUrl,
        created: bookmarkCreated,
        keywords: bookmarkKeywords,
        author: bookmarkAuthor,
    };

    if (bookmark.url.length > 0) {
        // Bookmark does not exists
        if (bookmarkId == '') {
            // Add new bookmark
            hoodie.store.add('bookmark', bookmark)
            .done(function(newBookmark) {
                hoodie.store.find('bookmark', newBookmark.id).publish();
                bookmarks.sendAlertMail(newBookmark)
            });

            $('#bookmarkModal').modal('hide');

            // Clear all fields
            $('#bookmarkModal input').each(function() {
                $('#bookmarkModal #bookmarkUrl').val('');
                $('#bookmarkModal #bookmarkKeywords').tagsinput('removeAll');
            });

            showAlert('Bookmark saved.', 'success');
        } else {
            // Update bookmark
            hoodie.global.find('bookmark', bookmarkId)
            .done(function() {
                hoodie.store.update('bookmark', bookmark).
                done(function() {
                    bookmarks.update(bookmark);
                });
            });

            $('#bookmarkModal').modal('hide');

            showAlert('<strong>Bookmark updated.</strong>', 'success');
        }
    } else {
        if ($('#bookmarkUrl + .text-danger').length < 1) {
            $('#bookmarkUrl').after('<p class="text-danger">Please provide a URL.</p>');
        }
    }
});
