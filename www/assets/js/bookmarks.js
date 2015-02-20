// Bookmarks Collection / View
function Bookmarks($bookmarkWrapper) {
    var collection = [];
    var $wrapper = $bookmarkWrapper;

    // Find index/position of a bookmark in collection.
    function getBookmarkItemIndexById(id) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].id === id) {
                return i;
            }
        }

        return null;
    }

    // show bookmarks
    this.paint = function() {
        // clear wrapper
        $wrapper.html('');

        // order by created
        this.sortBookmarks();

        $.each(collection, function(i, bookmark) {
            var html = '<article class="bookmark" data-id="' + bookmark.id + '"><h3><a href="' + bookmark.url + '" target="_blank">' +
                       bookmark.url + '</a></h3><p>' + formatTime(bookmark.created) + ' | ' + 'Author: ' + bookmark.author + '</p>' +
                       '<input type="text" id="bookmarkKeywords" class="form-control tagsinput" data-role="tagsinput" disabled="disabled" value="' + bookmark.keywords + '">' +
                       '</article>';

            $wrapper.append(html);
        });

        $('.tagsinput').tagsinput();
    };

    this.add = function(bookmark) {
        if (bookmark.visibility) {
            hoodie.store.find('bookmarks', bookmark.id).publish();
        }

        collection.push(bookmark);
        this.paint();
    };

    this.update = function(bookmark) {
        if (bookmark.visibility) {
            hoodie.store.find('bookmarks', bookmark.id).publish();
        } else {
            hoodie.store.find('bookmarks', bookmark.id).unpublish();
        }

        collection[getBookmarkItemIndexById(bookmark.id)] = bookmark;
        this.paint();

        showBadge('Bookmark updated.', 'success');
    };

    this.remove = function(bookmark) {
        collection.splice(getBookmarkItemIndexById(bookmark.id), 1);
        this.paint();

        showBadge('Bookmark removed.', 'success');
    };

    this.clear = function() {
        collection = [];
        this.paint();
    };

    this.sortBookmarks = function() {
        // order by created
        collection = collection.sort(function(a, b) {
            if (bookmarkOrder.direction == 'desc') {
                return (a.created < b.created) ? 1 : -1;
            } else {
                return (a.created > b.created) ? 1 : -1;
            }
        });
    }

    /**
     * Send notification mail about new bookmarks
     *
     * @TODO: add link to bookmark in mail body (with anchor to id)
     */
    this.sendAlertMail = function() {
        hoodie.store.findAll('usersettings').then(function(userSettings) {
            $.each(userSettings, function() {
                // do not send mail to user who added the bookmark
                if (hoodie.account.username + '-config' != this.id) {
                    // only send mail if user wants to receive notifications
                    if (this.notification) {
                        hoodie.email.send({
                            to: this.email,
                            subject: 'A new bookmark was added!',
                            text: 'One of your co-workers added a new bookmark. Check it out!',
                        });

                        console.log('sent mail to: "' + this.email + '"');
                    }
                }
            });
        });
    };

    function formatTime(dateTime) {
        var date = new Date(dateTime);

        if (date.getHours() >= 12){
            var hour = parseInt(date.getHours()) - 12;
            var amPm = "PM";
        } else {
            var hour = date.getHours(); 
            var amPm = "AM";
        }
        var time = hour + ":" + date.getMinutes() + " " + amPm;

        return time;
    };
}
