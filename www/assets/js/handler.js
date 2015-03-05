// Handle hoodie actions
$(document).ready(function() {
    // Account
    hoodie.account.on('signin', initializeBookmarks);
    hoodie.account.on('signout', bookmarks.clear);
    hoodie.account.on('signout', resetFilter);

    // Global store
    hoodie.global.on('bookmark:add', bookmarks.add);
    hoodie.global.on('bookmark:remove', bookmarks.remove);
});

// Handle creating / editing a new bookmark
$(document).on('click', '#bookmarkModal #saveSettings', function(event) {
    var bookmarkUrl        = $('#bookmarkUrl').val();
    var bookmarkId         = bookmarks.urlExists(bookmarkUrl);
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

// Handle changing sort order
$('#sortDirection').change(function() {
    bookmarkOrder.direction = $('#sortDirection option:checked').val();
    bookmarks.paint();
});

// Handle open user settings modal
$('#settings-button').click(function (event) {
    // initial load of current user settings from the store
    hoodie.global.find('usersettings', hoodie.account.username + '-config').done(function(userSettings) {
        $('#settingsEmail').val(userSettings.email);
        $('#settingsNotification').prop('checked', userSettings.notification);
    });
});

// Handle modal close
$('body').on('hide.bs.modal', '#bookmarkModal', function() {
    // Remove error message
    $('#bookmarkUrl + .text-danger').remove();
});

// Handle update user settings
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

// Handle click on appName
$('#reloadPage').click(function(event) {
    event.preventDefault();
    location.reload();
});

// Handle remove boookmark
$('#bookmarkWrapper').on('click', '.remove-bookmark', function(event) {
    var bookmarkId = $(this).parents('article').data('id');

    hoodie.global.find('bookmark', bookmarkId)
    .done(function(bookmark) {
        if (bookmark.author == hoodie.account.username) {
            // Remove bookmark from store
            hoodie.global.remove('bookmark', bookmark.id)
            .done(function(oldBookmark) {
                // Bookmark needs to be unpublished, so other users wont see it anymore
                hoodie.store.find('bookmark', oldBookmark.id).unpublish();

                showAlert('Bookmark removed.', 'success');
            });
        } else {
            // Current user is not equal bookmark author
            showAlert('<strong>Bookmark cannot be removed.</strong> You are not allowed to remove other users\' bookmarks.', 'danger');
        }
    });
});

// Handle search click
$('#bookmarkSearch').submit(function(event) {
    event.preventDefault();
    var searchKeyword = $('#bookmarkSearchKeywords').val();

    if (searchKeyword) {
        $('#bookmarkSearchIcon').removeClass('glyphicon-search');
        $('#bookmarkSearchIcon').addClass('glyphicon-remove');
    } else {
        $('#bookmarkSearchIcon').removeClass('glyphicon-remove');
        $('#bookmarkSearchIcon').addClass('glyphicon-search');
    }

    bookmarks.findBookmarksByKeyword(searchKeyword);
});

// Handle remove search keyword click
$('#bookmarkSearchIcon').click(function() {
    if ($(this).hasClass('glyphicon-remove')) {
        $('#bookmarkSearchKeywords').val('');
        $('#bookmarkSearch').trigger('submit');
    }
});
