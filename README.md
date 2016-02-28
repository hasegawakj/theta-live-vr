# RICOH Theta S live viewer for Firefox VR

![Screen Shot](https://github.com/nishioka/theta-live-vr/raw/master/app/images/theta-vr-small.png "Screen Shot")

## Usage

```
npm install & bower install
```

Run `gulp`.

## Caution

PeerJS in Firefox need a patch. See below.

Patch to prevent the pc is undefined error on firefox 40+  
https://github.com/peers/peerjs/pull/306

```
npm install peerjs_fork_firefox40
```
and overwrite peer.js.

## License
Under the [MIT License](https://tldrlegal.com/l/mit).
