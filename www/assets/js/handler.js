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
$('#bookmarkSearchSubmit').click(function() {
    var searchKeyword = $('#bookmarkSearchKeywords').val();

    bookmarks.findBookmarksByKeyword(searchKeyword);
});
