// Handle creating / editing a new bookmark
$(document).on('click', '#bookmarkModal #saveSettings', function(event) {
    var bookmarkUrl        = $('#bookmarkUrl').val();
    var bookmarkId         = bookmarks.urlExists(bookmarkUrl);
    var bookmarkCreated    = new Date().getTime();
    var bookmarkKeywords   = $('#bookmarkKeywords').val().split(',');

    for (var i = 0; i < bookmarkKeywords.length; i++) {
        bookmarkKeywords[i] = bookmarkKeywords[i].trim();

        if (bookmarkKeywords[i].trim() == '') {
            delete bookmarkKeywords[i];
        }
    }

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
                $('#bookmarkModal #bookmarkKeywords').val('');
            });

            showAlert('Bookmark saved.', 'success');
        } else {
            // Prompt user to accept update
            var updateIsConfirmed = confirm('Bookmark with id "' + bookmarkId + '" will be updated. Continue?');

            if (updateIsConfirmed) {
                bookmark.id = bookmarkId;

                // Update bookmark
                hoodie.global.find('bookmark', bookmark.id)
                .done(function() {
                    hoodie.store.update('bookmark', bookmark.id, bookmark)
                    .done(function(updatedBookmark) {
                        bookmarks.update(updatedBookmark);
                    });
                });

                $('#bookmarkModal').modal('hide');

                // Clear all fields
                $('#bookmarkModal input').each(function() {
                    $('#bookmarkModal #bookmarkUrl').val('');
                    $('#bookmarkModal #bookmarkKeywords').val('');
                });

                showAlert('<strong>Bookmark updated.</strong>', 'success');
            }
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
    hoodie.global.find('usersettings', hoodie.account.username + '-config')
    .done(function(userSettings) {
        $('#settingsEmail').val(userSettings.email);
        $('#settingsNotification').prop('checked', userSettings.notification);
    })
    .fail(function(error) {
        console.log(error);
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
        $('#bookmarkSearchIcon').attr('title', 'Remove search');
    } else {
        $('#bookmarkSearchIcon').removeClass('glyphicon-remove');
        $('#bookmarkSearchIcon').addClass('glyphicon-search');
        $('#bookmarkSearchIcon').attr('title', '');
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

// Trigger submit on keyword click
$('#bookmarkWrapper').on('click', '.bookmark-keywords li', function() {
    var keyword = $(this).text();
    $('#bookmarkSearchKeywords').val(keyword);
    $('#bookmarkSearch').trigger('submit');
});

// Handle edit bookmark
$('#bookmarkWrapper').on('click', '.edit-bookmark', function(event) {
    event.preventDefault();
    var bookmarkId = $(this).parents('article').data('id');

    hoodie.global.find('bookmark', bookmarkId)
    .done(function(bookmark) {
        $('#bookmarkModal #bookmarkUrl').val(bookmark.url);
        $('#bookmarkModal #bookmarkKeywords').val(bookmark.keywords);

        $('#bookmarkModal').modal('show');
    });
})
