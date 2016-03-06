'use strict';

var localMediaStream;

navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

// Connect to PeerJS, have server assign an ID instead of providing one
// Showing off some of the configs available with PeerJS :).
var peer = new Peer({
    // Set API key for cloud server (you don't need this if you're running your
    // own.
    key: 'x7fwx2kavpy6tj4i',

    // Set highest debug level (log everything!).
    debug: 3
});

// Show my peer's ID.
peer.on('open', function (id) {
    var peerID = $('#pid');
    peerID.text(id);
    var tweetButton = $('<a>Tweet</a>');
    tweetButton.attr({
        'href': 'https://twitter.com/share',
        'class': 'twitter-share-button',
        'data-lang': 'ja',
        'data-count': 'none',
        'data-url': location.href + '?id=' + id,
        'data-text': 'THETA S Live Streaming'
    });
    peerID.after(tweetButton);
    twttr.widgets.load();
});

peer.on('error', function (err) {
    console.log(err);
});


/*
 * CLIENT
 */
// Connect to host peer
$('#connect').click(function () {
    var requestedPeer = $('#rid').val();
    peer.connect(requestedPeer);

    // Await call stream from host
    peer.on('call', function (call) {
        call.answer();

        // Wait for stream on the call, then set peer video display
        call.on('stream', function (remoteMediaStream) {
            console.log('recived stream from host');
            if (typeof video.mozSrcObject !== 'undefined') {
                // moz
                video.mozSrcObject = remoteMediaStream;
            } else {
                // others
                video.src = (window.URL && window.URL.createObjectURL(remoteMediaStream)) || remoteMediaStream;
            }

            video.play();
        });
    });
});


/*
 * HOST
 */
$('#host').click(function () {
    // Get audio/video stream
    if (navigator.getUserMedia) {
        var p = navigator.mediaDevices.getUserMedia({
            //audio: true,
            video: true
        });

        p.then(function(stream) {
            // Set your video to displays
            if (typeof video.mozSrcObject !== 'undefined') {
                // moz
                video.mozSrcObject = stream;
            } else {
                // others
                video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
            }
            localMediaStream = stream;
            console.log('get localMedia');
            $('#client').hide();
            $('#connected-list').show();

            video.play();

            peer.on('connection', function(dataConnection) {
                console.log('get connection from client(' + dataConnection.peer + ')');
                $('#connected').append('<li class="list-group-item">' + dataConnection.peer + '</li>');
                peer.call(dataConnection.peer, localMediaStream);
            });
        });

        // always check for errors at the end.
        p.catch(function(e) {
            console.log(e.name);
        });
    } else {
        console.log('getUserMedia not supported');
    }
});

// Close a connection.
$('#close').click(function () {
    eachActiveConnection(function (c) {
        c.close();
    });
});

$(window).on('load', function() {
    $('#connected-list').hide();
    var url = $.url();
    var id = url.param('id');
    $('#rid').val(id);
});

// Goes through each active peer and calls FN on its connections.
function eachActiveConnection(fn) {
    var actives = $('.active');
    var checkedIds = {};
    actives.each(function () {
        var peerId = $(this).attr('id');

        if (!checkedIds[peerId]) {
            var conns = peer.connections[peerId];
            for (var i = 0, ii = conns.length; i < ii; i += 1) {
                var conn = conns[i];
                fn(conn, $(this));
            }
        }

        checkedIds[peerId] = 1;
    });
}


// Make sure things clean up properly.
$(window).on('unload beforeunload', function (e) {
    if (!!peer && !peer.destroyed) {
        peer.destroy();
    }
});