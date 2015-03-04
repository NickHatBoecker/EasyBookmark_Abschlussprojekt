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

        bookmarks.sortBookmarks();

        $.each(collection, function(i, bookmark) {
            var currentBookmarkId = window.location.hash;
            var currentBookmark = '';

            if (bookmark.id == currentBookmarkId.substr(1)) {
                currentBookmark = '<small><span class="glyphicon glyphicon-arrow-right" aria-hidden="true"></span></small> ';
            }
            var html = '<article id="' + bookmark.id + '" class="bookmark" data-id="' + bookmark.id + '">' +
                       '<button type="button" class="close remove-bookmark" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                       '<h3>' + currentBookmark + '<a href="' + bookmark.url + '" target="_blank">' + bookmark.url + '</a></h3>' +
                       '<p>' + formatTime(bookmark.created) + ' | ' + 'Author: ' + bookmark.author + '</p>' +
                       '<input type="text" id="bookmarkKeywords" class="form-control tagsinput" data-role="tagsinput" disabled="disabled" value="' + bookmark.keywords + '">' +
                       '</article>';

            $wrapper.append(html);
        });

        if (collection.length == 0) {
            $wrapper.append('<p>No bookmarks found.</p>');
        }

        // reinitialize tagsinput
        $('.tagsinput').tagsinput();

        // Disable bootstrap-tagsinput, so it cannot be focused
        $('.bootstrap-tagsinput input').each(function() {
            $(this).prop('disabled', true);
        });
    };

    this.add = function(bookmark) {
        if (bookmark) {
            collection.push(bookmark);
            bookmarks.paint();
        }
    };

    this.update = function(bookmark) {
        collection[getBookmarkItemIndexById(bookmark.id)] = bookmark;
        bookmarks.paint();
    };

    this.remove = function(bookmark) {
        collection.splice(getBookmarkItemIndexById(bookmark.id), 1);
        bookmarks.paint();
    };

    this.clear = function() {
        collection = [];
        bookmarks.paint();
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
     * @param object bookmark
     */
    this.sendAlertMail = function(bookmark) {
        hoodie.global.findAll('usersettings').then(function(userSettings) {
            $.each(userSettings, function() {
                // do not send mail to user who added the bookmark
                if (bookmark.author + '-config' != this.id) {
                    // only send mail if user wants to receive notifications
                    if (this.notification) {
                        hoodie.email.send({
                            to: this.email,
                            subject: 'A new bookmark was added!',
                            text: "One of your co-workers added a new bookmark. Check it out!\n\n" + window.location.origin + '#' + bookmark.id,
                        });

                        console.log('sent mail to: "' + this.email + '"');
                    }
                }
            });
        });
    };

    /**
     * Check if given url already exists in collection.
     * If bookmark exists, bookmark ID is returned, else an empty string
     *
     * @param string url
     * @return string
     */
    this.exists = function(url) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].url == url) {
                return collection[i].id;
            }
        }

        return '';
    };

    /**
     * By now it is only possible to search for one single keyword
     *
     * @param string searchKeyword
     */
    this.findBookmarksByKeyword = function(searchKeyword) {
        // Reset collection
        bookmarks.clear();
        hoodie.global.findAll('bookmark').done(function(allBookmarks) {
            $(allBookmarks).each(function() {
                bookmarks.add(this);
            });

            if (searchKeyword) {
                // Backup and clear collection
                var oldCollection = collection;
                bookmarks.clear();

                // Now search for keyword in bookmarkUrl and bookmarkKeywords
                $.each(oldCollection, function(i, bookmark) {
                    if ((bookmark.url.search(searchKeyword) >= 0) || ($.inArray(searchKeyword, bookmark.keywords) >= 0)) {
                        bookmarks.add(bookmark);
                    }
                });
            }
        });
    };

    /**
     * Convert Timestamp to "g A" format
     *
     * @papram timestamp dateTime
     * @return string time
     */
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
