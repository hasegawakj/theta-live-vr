"use strict"

var container;

var camera, scene;
var vrEffect, renderer;
var clock, vrControl, monoControl;

var video, videoContext, texture;

var helper, axis, grid;

var modeVR = false;

var srcwidth = 1280;
var srcheight = 720;

///////// degree to radian utility function
var d2r = function(d) { return d * Math.PI / 180; };

var degree = [d2r(0), d2r(0), d2r(0)];

var firstview = d2r(0);
var pan = firstview;
var tilt = d2r(0);
var zoom = 70;
var	cameraDir = new THREE.Vector3(Math.sin(pan), Math.sin(tilt), Math.cos(pan));

function addAxisGrid() {
    // X軸:赤, Y軸:緑, Z軸:青
    axis = new THREE.AxisHelper(2000);
    scene.add(axis);

    // GridHelper
    grid = new THREE.GridHelper(2000, 100);

    helper = false;
}

function removeAxisGrid() {
    scene.remove(axis);
    scene.remove(grid);

    helper = false;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (modeVR) {
        vrEffect.setSize(window.innerWidth, window.innerHeight);
    } else {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function show(element) {
    element.classList.remove('display-none');
}

function hide(element) {
    element.classList.add('display-none');
}

function onkey(event) {
    event.preventDefault();

    if (event.keyCode === 90) { // z
        vrControl.zeroSensor();
    } else if (event.keyCode === 70 || event.keyCode === 13) { //f or enter
        vrEffect.setFullScreen(true); //fullscreen
    } else if (event.keyCode === 72) { //h
        rotest();
        if (helper) {
            removeAxisGrid();
        } else {
            addAxisGrid();
        }
    }
}

function init() {
    clock = new THREE.Clock();
    
    // レンダーのセットアップ
    renderer = new THREE.WebGLRenderer({antialias: true});

    // VR stereo rendering
    vrEffect = new THREE.VREffect(renderer);
    vrEffect.setSize(window.innerWidth, window.innerHeight);

    renderer.setSize(window.innerWidth, window.innerHeight);

    // container that fullscreen will be called on.
    container = document.getElementById('vrContainer');
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(zoom, window.innerWidth / window.innerHeight);
    //camera.position.set(0, 0, 0.1);
	//camera.lookAt(cameraDir);
    console.log('cameraDir', cameraDir);

    // for VR
    vrControl = new THREE.VRControls(camera);
    
    // for not VR
    monoControl = new THREE.FirstPersonControls(camera);

    // FirstPersonControls
    monoControl.lookSpeed = 0.1;
    monoControl.movementSpeed = 0;
    monoControl.noFly = true;
    monoControl.lookVertical = true;
    monoControl.constrainVertical = true;
    monoControl.verticalMin = 1.0;
    monoControl.verticalMax = 2.0;
    monoControl.lon = -160;
    monoControl.lat = 160;

    scene = new THREE.Scene();

    addAxisGrid();
    helper = true;

    // 画面ダブルクリックでfull-screen VR mode
    window.addEventListener('dblclick', function () {
        modeVR = true;
        vrEffect.setFullScreen(true);
    }, false);

    // full-screen VR modeからの復帰時の処理
    document.addEventListener('mozfullscreenchange', function () {
        if (document.mozFullScreenElement === null) {
            modeVR = false;
        }
    });

    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener('keydown', onkey, true);

    // enterVR button
    var enterVr = document.getElementById('enterVR');
    // when VR is not detected
    var getVr = document.getElementById('getVR');
    VRClient.getVR.then(function () {
        // vr detected
        getVr.classList.add('display-none');
    }, function () {
        // displays when VR is not detected
        enterVr.classList.add('display-none');
        getVr.classList.remove('display-none');
    });
    // VRボタンクリックでfull-screen VR mode
    enterVr.addEventListener('click', function () {
        modeVR = true;
        vrEffect.setFullScreen(true);
    }, false);
    
    ///////// SPHERE
    var geometry = new THREE.SphereGeometry(100, 32, 16);

	///////// VIDEO
	video = document.createElement('video');
	video.loop = false;
	video.volume = 0.5;

    navigator.getUserMedia = ( navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia);

    if (navigator.getUserMedia) {
        navigator.getUserMedia(
            {
                video: true,
                audio: true
            },
            function(localMediaStream) {
                if ( typeof video.mozSrcObject !== 'undefined') {
                    // moz
                    video.mozSrcObject = localMediaStream;
                } else {
                    // others
                    video.src = ( window.URL && window.URL.createObjectURL( localMediaStream ) ) || localMediaStream;
                }

                video.play();
            },
            function ( error ) {
                console.log( error );
            }
        );
    } else {
        console.log('getUserMedia not supported');
    }

    var videoCanvas = document.createElement('canvas');
    videoCanvas.width = srcwidth;
    videoCanvas.height = srcheight;

	videoContext = videoCanvas.getContext('2d');
	videoContext.fillStyle = '#000000';
	videoContext.fillRect(0, 0, videoCanvas.width, videoCanvas.height);

	///////// TEXTURE
	texture = new THREE.Texture(videoCanvas);
    texture.minFilter = THREE.LinearFilter;
	texture.flipY = false;

	///////// MATERIAL
	var material = new THREE.ShaderMaterial({
		uniforms: {
            tMatCap: { type: 't', value: texture },
            uvOffset: {type: 'v4', value: new THREE.Vector4(0, 0, 0, 0)},
            radius: { type: 'f', value: 0.445 }
		},
		vertexShader: document.getElementById( 'sem-vs' ).textContent,
		fragmentShader: document.getElementById( 'sem-fs' ).textContent,
		shading: THREE.SmoothShading,
        side: THREE.DoubleSide
	});

	material.uniforms.tMatCap.value.wrapS = material.uniforms.tMatCap.value.wrapT = THREE.ClampToEdgeWrapping;

	///////// MESH
	var mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = Math.PI;
	mesh.rotation.x += degree[0];
	mesh.rotation.y += degree[1];
	mesh.rotation.z += degree[2];
	scene.add(mesh);
}

function animate() {
    // keep looping
    requestAnimationFrame(animate);

	///////// Draw Loop
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        videoContext.drawImage(video, 0, 0);
        if (texture) {
            texture.needsUpdate = true;
        }
    }

    // render and control update
    if (modeVR) {
        // Update VR headset position and apply to camera.
        vrControl.update();
        // Render the scene through the VREffect.
        vrEffect.render(scene, camera);
    } else {
        var delta = clock.getDelta();
        monoControl.update(delta);
        renderer.render(scene, camera);
    }
}

//logs camera pos when h is pressed
function rotest() {
    console.log(camera.rotation.x, camera.rotation.y, camera.rotation.z);
}

init();
animate();
