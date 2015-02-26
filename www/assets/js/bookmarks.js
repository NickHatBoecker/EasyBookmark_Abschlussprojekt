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
        this.sortBookmarks();

        $.each(collection, function(i, bookmark) {
            var visibility = '';
            if (!bookmark.visibility) {
                visibility = ' | <span class="text-danger">Privat</span>';
            }

            var html = '<article id="' + bookmark.id + '" class="bookmark" data-id="' + bookmark.id + '"><h3><a href="' + bookmark.url + '" target="_blank">' +
                       bookmark.url + '</a></h3><p>' + formatTime(bookmark.created) + ' | ' + 'Author: ' + bookmark.author + visibility + '</p>' +
                       '<input type="text" id="bookmarkKeywords" class="form-control tagsinput" data-role="tagsinput" disabled="disabled" value="' + bookmark.keywords + '">' +
                       '</article>';

            $wrapper.append(html);
        });

        // reinitialize tagsinput
        $('.tagsinput').tagsinput();
    };

    this.add = function(bookmark) {
        if (bookmark) {
            hoodie.store.find('bookmarks', bookmark.id).publish();

            collection.push(bookmark);
            this.paint();
        }
    };

    this.update = function(bookmark) {
        if (bookmark.visibility) {
            hoodie.store.find('bookmarks', bookmark.id).publish();
        } else {
            hoodie.store.find('bookmarks', bookmark.id).unpublish();
        }

        collection[getBookmarkItemIndexById(bookmark.id)] = bookmark;
        this.paint();

        showAlert('Bookmark updated.', 'success');
    };

    this.remove = function(bookmark) {
        collection.splice(getBookmarkItemIndexById(bookmark.id), 1);
        this.paint();

        showAlert('Bookmark removed.', 'success');
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
     * @param object bookmark
     */
    this.sendAlertMail = function(bookmark) {
        hoodie.global.findAll('usersettings').then(function(userSettings) {
            $.each(userSettings, function() {
                // do not send mail to user who added the bookmark
                if (bookmark.author + '-config' != this.id) {
                    var test = hoodieUrl;
                    // only send mail if user wants to receive notifications
                    if (this.notification) {
                        hoodie.email.send({
                            to: this.email,
                            subject: 'A new bookmark was added!',
                            text: "One of your co-workers added a new bookmark. Check it out!\n\n" + hoodieUrl + '#' + bookmark.id,
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
