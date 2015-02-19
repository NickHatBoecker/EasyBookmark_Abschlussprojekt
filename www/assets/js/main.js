//"use strict";

$(document).ready(function(){
    hoodie = new Hoodie();
    bookmarks = new Bookmarks($('#bookmarkWrapper'));

    var usernameButton = $('#username').html().replace('{Username}', hoodie.account.username);
    $('#username').html(usernameButton);

    loadModalContents();

    // @TODO: Login
    hoodie.account.signIn('testuser', 'test123');

    $('.tagsinput').tagsinput();

    // initial load of all bookmark items from the store
    hoodie.store.findAll('bookmark').then(function(allBookmarks) {
        $(allBookmarks).each(function() {
            bookmarks.add(this);
        });

        $('.tagsinput').tagsinput();
    });

    // when a bookmark changes, update the UI.
    hoodie.store.on('add:bookmark', bookmarks.add);
    hoodie.store.on('update:bookmark', bookmarks.update);
    hoodie.store.on('remove:bookmark', bookmarks.remove);

    // clear everything when user logs out,
    hoodie.account.on('signout', bookmarks.clear);
});

// handle creating / editing a new bookmark
$(document).on('click', '#bookmarkModal #saveSettings', function(event) {
    var bookmarkUrl = $('#bookmarkUrl').val();

    if (bookmarkUrl.length > 0) {
        // @TODO: url unique validation, search through whole collection

        var bookmarkCreated    = new Date().getTime();
        var bookmarkTags       = $('#bookmarkKeywords').val().split(',');
        var bookmarkAuthor     = hoodie.account.username;
        var bookmarkVisibility = $('#bookmarkVisibility').val();

        var bookmark = {
            url: bookmarkUrl,
            created: bookmarkCreated,
            keywords: bookmarkTags,
            author: bookmarkAuthor,
            visibility: bookmarkVisibility,
        };

        // @TODO: get real id
        if ($(this).data('id')) {
            // Settings already exists, so update
            hoodie.store.update('bookmark', $(this).data('id'), bookmark);
        } else {
            hoodie.store.add('bookmark', bookmark);
        }

        $('#bookmarkModal').modal('hide');

        // Show badge
        showBadge('Bookmark saved.', 'success');

        bookmarks.sendAlertMail();
    }
});

// update modal headline
$('.edit-bookmark').click(function (event) {
    $('#bookmarkModal').find('.modal-title').text($(this).data('headline'));
});

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

        hoodie.store.find('usersettings', hoodie.account.username + '-config')
        .done(function() {
            // Settings already exists, so update
            hoodie.store.update('usersettings', userSettings.id, userSettings);
        })
        .fail(function() {
            hoodie.store.add('usersettings', userSettings);
        });

        $('#settingsModal').modal('hide');

        // Show badge
        showBadge('Settings saved.', 'success');
    }
});

function showBadge(text, type)
{
    $('#alerts').hide().prepend(
        '<div class="alert alert-' + type + '" role="alert"' +
        ' style="position: absolute; top: 52px; width: 100%; z-index: 999999; border-radius: 0;"' +
        '><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>' +
        '</button>' + text + '</div>'
    ).fadeIn();
    $('.alert').delay(4000).fadeOut('slow');
}

function loadModalContents()
{
    var link = document.querySelector('link[rel="import"]');
    var content = link.import;

    // Grab DOM from warning.html's document.
    var el = content.querySelector('#modals');

    document.body.appendChild(el.cloneNode(true));
}
