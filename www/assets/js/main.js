//"use strict";

$(document).ready(function(){
    hoodie = new Hoodie();
    bookmarks = new Bookmarks($('#bookmarkWrapper'));
    hoodieUrl = 'http://192.168.56.101:6001';

    bookmarkOrder = {
        attribute: 'created',
        direction: $('#sortDirection option:checked').val()
    };

    loadModalContents();

    // initialize tagsinput
    $('.tagsinput').tagsinput();

    // initial load of all bookmark items from the store
    initializeBookmarks();

    // clear everything when user logs out,
    hoodie.account.on('signin', initializeBookmarks);
    hoodie.account.on('signout', bookmarks.clear);
});

// handle creating / editing a new bookmark
$(document).on('click', '#bookmarkModal #saveSettings', function(event) {
    var bookmarkUrl        = $('#bookmarkUrl').val();
    var bookmarkId         = bookmarks.exists(bookmarkUrl);
    var bookmarkCreated    = new Date().getTime();

    // @TODO: keywords do not update, it's always "public" and "awesome"
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

                bookmarks.add(newBookmark);
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
        // @TODO: do not use alert, show error message under url-field
        showAlert('<strong>Bookmark not saved.</strong> Please provide a URL.', 'danger');
    }
});

// handle changing sort order
$('#sortDirection').change(function() {
    bookmarkOrder.direction = $('#sortDirection option:checked').val();
    bookmarks.paint();
});

// handle open user settings modal
$('#settings-button').click(function (event) {
    // initial load of current user settings from the store
    hoodie.store.find('usersettings', hoodie.account.username + '-config').done(function(userSettings) {
        $('#settingsEmail').val(userSettings.email);
        $('#settingsNotification').prop('checked', userSettings.notification);
    });
});

// handle update user settings
$(document).on('click', '#settingsModal #saveSettings', function(event) {
    var settingsEmail = $('#settingsEmail').val();

    if (settingsEmail == '') {
        alert('Please provide a valid e-mail address');
    } else {
        var settingsNotification = $('#settingsNotification').prop('checked');

        var userSettings = {
            id: hoodie.account.username + '-config',
            email: settingsEmail,
            notification: settingsNotification
        };

        hoodie.global.find('usersettings', hoodie.account.username + '-config')
        .done(function() {
            // Settings already exists, so update
            hoodie.store.update('usersettings', userSettings.id, userSettings);
        })
        .fail(function() {
            hoodie.store.add('usersettings', userSettings)
            .done(function(newUserSettings) {
                hoodie.store.find('usersettings', newUserSettings.id).publish();
            });
        });

        $('#settingsModal').modal('hide');

        showAlert('Settings saved.', 'success');
    }
});

$('#reloadPage').click(function(event) {
    event.preventDefault();
    location.reload();
});

// handle remove boookmark
$('#bookmarkWrapper').on('click', '.remove-bookmark', function(event) {
    var bookmarkId = $(this).parents('article').data('id');

    hoodie.global.find('bookmark', bookmarkId)
    .done(function(bookmark) {
        if (bookmark.author == hoodie.account.username) {
            // Bookmark needs to be unpublished, so other users wont see it anymore
            hoodie.store.find('bookmark', bookmark.id).unpublish();

            // Remove bookmark from store
            hoodie.store.remove('bookmark', bookmark.id)
            .done(function(oldBookmark) {
                bookmarks.remove(oldBookmark);
                showAlert('Bookmark removed.', 'success');
            })
            .fail(function(error) {
                // Bookmark could no be found
                console.log(error);

                // Remove bookmark from collection anyway
                bookmarks.remove({ id: error.id });
            });
        } else {
            // Current user is not equal bookmark author
            showAlert('<strong>Bookmark cannot be removed.</strong> You are not allowed to remove other users\' bookmarks.', 'danger');
        }
    });
});

/**
 * Show alert with given text, colour is specified by type
 *
 * @params string text, type (available types: succes, danger, info, warning)
 */
function showAlert(text, type)
{
    $('#alerts').hide().prepend(
        '<div class="alert alert-' + type + '" role="alert"' +
        ' style="position: absolute; top: 52px; width: 100%; z-index: 5; border-radius: 0;"' +
        '><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>' +
        '</button>' + text + '</div>'
    ).fadeIn();
    $('.alert').delay(4000).fadeOut('slow');
}

// Load modal HTML
function loadModalContents()
{
    var link = document.querySelector('link[rel="import"]');
    var modals = link.import.querySelector('#modals');

    document.body.appendChild(modals.cloneNode(true));
}

function initializeBookmarks(allBookmarks)
{
    hoodie.global.findAll('bookmark').done(function(allBookmarks) {
        $(allBookmarks).each(function() {
            bookmarks.add(this);
        });
    });
}
