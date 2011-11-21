/*
 *  Copyright (c) 2011 The ORMMA.org project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */
 
 
 /* 
  * Code flow is
  * (1) buttons on interface call render()
INFO rendering
INFO creating adWindow
  *   (.) onload event of new browser window	
INFO adWindow loaded  
  *   (a) renderAd - Flight tab>ad fragment
  *   (b) renderHtmlAd - Flight tab>ad url
  *   (c) reloadAd - Test tab
  * (2) render() calls initAdFrame()
INFO initializing ad frame  
  * (3) initAdFrame() calls initAdBridge()
INFO initializing bridge object [object Object]
  * (4) initAdBridge() calls
  *   (a) EventListeners.add for info reporting
INFO activating info
  *   (b) EventListeners.add for error reporting
INFO activating error
  *   (c) pushChange() for initialization of all other properties
INFO controller initialized
INFO setting state to loading
INFO setting screenSize to {'width':320,'height':480}
INFO setting orientation to 0
INFO setting size to {'width':320,'height':50}
INFO setting default position to {'width':320,'height':50,'y':0,'x':0}
INFO setting maxSize to {'width':320,'height':480}
INFO merging expandProperties with {'width':0,'height':0,'useCustomClose':false,'isModal':false,'useBackground':false,'backgroundColor':16777215,'backgroundOpacity':1}
INFO setting supports to [screen]

  * (5) pushChange() calls the addEventListener() method in ormma.js
  * (6) addEventListener() calls changeHandlers.[listener]
  * (7) changeHandlers.state() in ormma.js attempts to call ORMMAReady through signalReady
  *   (a) attempt callback for ORMMAReady
INFO controller ready, attempting callback
  *   (b) send ready event
INFO activating ready
  * (8) identification script loaded
INFO mraid.js identification script found
  * (9) readyTimeout() in ormma.js errors when attempts to call ORMMAReady time out
INFO No ORMMAReady callback found (timeout of 10000ms occurred), assume use of ready eventListener.
  */

  
(function() {
    var ormmaview = window.ormmaview = {};
    
    // CONSTANTS ///////////////////////////////////////////////////////////////
    
    var STATES = ormmaview.STATES = {
        UNKNOWN     :'unknown',
		LOADING		:'loading',
        DEFAULT     :'default',
        RESIZED     :'resized',
        EXPANDED    :'expanded',
        HIDDEN      :'hidden'
    };
    
    var EVENTS = ormmaview.EVENTS = {
		READY				:'ready',
        ERROR               :'error',
        INFO                :'info',
        HEADINGCHANGE       :'headingChange',
        KEYBOARDCHANGE      :'keyboardChange',
        LOCATIONCHANGE      :'locationChange',
        NETWORKCHANGE       :'networkChange',
        ORIENTATIONCHANGE   :'orientationChange',
        RESPONSE            :'response',
        SCREENCHANGE        :'screenChange',
        SHAKE               :'shake',
        SIZECHANGE          :'sizeChange',
        STATECHANGE         :'stateChange',
        TILTCHANGE          :'tiltChange',
 		VIEWABLECHANGE		:'viewableChange'
    };
    
    var FEATURES = ormmaview.FEATURES = {
        LEVEL1      :'level-1',
        LEVEL2      :'level-2',
        SCREEN      :'screen',
        ORIENTATION :'orientation',
        HEADING     :'heading',
        LOCATION    :'location',
        SHAKE       :'shake',
        TILT        :'tilt',
        NETWORK     :'network',
        SMS         :'sms',
        PHONE       :'phone',
        EMAIL       :'email',
        CALENDAR    :'calendar',
        CAMERA      :'camera',
		MAP			:'map',
		AUDIO		:'audio',
		VIDEO		:'video'
    };
    
    var NETWORK = ormmaview.NETWORK = {
        OFFLINE :'offline',
        WIFI    :'wifi',
        CELL    :'cell',
        UNKNOWN :'unknown'
    };
    
    // EVENT HANDLING ///////////////////////////////////////////////////////////////
    
    var listeners = {};
    
    var broadcastEvent = function() {
        var args = new Array(arguments.length);
        for (var i = 0; i < arguments.length; i++) args[i] = arguments[i];
        var event = args.shift();
        for (var key in listeners[event]) {
            var handler = listeners[event][key];
            handler.func.apply(handler.func.scope, args);
        }
    }
	
	ormmaview.broadcastEvent = broadcastEvent;
    
    ormmaview.addEventListener = function(event, listener, scope) {
        var key = String(listener) + String(scope);
        var map = listeners[event]
        if (!map) {
            map = {};
            listeners[event] = map;
        }
        map[key] = {scope:(scope?scope:{}),func:listener};
    };
    
    ormmaview.removeEventListener = function(event, listener, scope) {
        var key = String(listener) + String(scope);
        var map = listeners[event];
        if (map) {
            map[key] = null;
            delete map[key];
        }
    };
    
    // PRIVATE VARIABLES ///////////////////////////////////////////////////////////////
    
    var
        adURI = "",
        adURIFragment = true,
		adHtml = '',
		useHtml = false;
        adContent = '',
        adWindow = null,
        adWindowAdj = {x:0,y:0},
        adFrame = null,
        adBridge = null,
        adController = null,
        intervalID = null,
        timeoutID = null,
        active = {},
        previousPosition = { x:0, y:0, width:0, height:0 },
        previousState = null,
        template = '';
    
    // ORMMA state variables - shared with frame
    var
        state = STATES.LOADING,
        screenSize = { width:0, height:0 },
        size = { width:0, height:0 },
        defaultPosition = { width:0, height:0, y:0, x:0 },
        maxSize = { width:0, height:0 },
        expandProperties = { width:0, height:0, useCustomClose:false, isModal:false, useBackground:false, backgroundColor:0xffffff, backgroundOpacity:1.0},
        supports = [
            'level-1',
            'level-2',
            'screen',
            'orientation',
            'heading',
            'location',
            'shake',
            'tilt',
            'network',
            'sms',
            'phone',
            'email',
            'calendar',
            'camera',
			'map',
			'audio',
			'video'
        ],
        heading = -1,
        keyboardState = false,
        location = null,
        network = NETWORK.UNKNOWN,
        orientation = -1,
        shakeProperties = null,
        tilt = null;
    
    // PUBLIC ACCESSOR METHODS ///////////////////////////////////////////////////////////////
    
    ormmaview.getAdContent = function() {
        return adContent;
    };
    
    ormmaview.setScreenSize = function(width, height) {
        screenSize.width = width;
        screenSize.height = height;
        orientation = (width >= height)?90:0;
    };
    
    ormmaview.setDefaultPosition = function(x, y, width, height) {
        defaultPosition.x = x;
        defaultPosition.y = y;
        size.width = defaultPosition.width = width;
        size.height = defaultPosition.height = height;
    };
    
    ormmaview.setMaxAdSize = function(width, height) {
        maxSize.width = width;
        maxSize.height = height;
    };
    
    ormmaview.setAdURI = function(uri, fragment) {
        adURI = uri;
        adURIFragment = (fragment)?true:false;
    };
	
	ormmaview.setUseHtml = function(useThisHtml, html) {
		useHtml = useThisHtml;
		if (useHtml) {
			adHtml = html;
		} else {
			adHtml = '';
		}	
	}
    
    ormmaview.setSupports = function(feature, doesSupport) {
        for (var i in supports) {
            if (supports[i] == feature) {
                if (!doesSupport) {
                    supports.splice(i,1);
                }
                return;
            }
        }
        if (doesSupport) {
            supports.push(feature);
        }
        broadcastEvent('info', stringify(supports));
    };
    
    ormmaview.setTemplate = function(name) {
        template = name;
    };
    
    ormmaview.rotateOrientation = function() {
        var s = { width:screenSize.width, height:screenSize.height };
        var p = { x:parseInt(adFrame.style.left), y:parseInt(adFrame.style.top), width:parseInt(adFrame.style.width), height:parseInt(adFrame.style.height) };
        
        var s1 = { width:s.height, height:s.width };
        var p1 = { x:p.x, y:p.y, width:(s1.width - (p.x + (s.width - (p.x + p.width)))), height:p.height };
        
        screenSize.width = s1.width;
        screenSize.height = s1.height;
        
        orientation = (orientation + 90) % 360;
        
        adWindow.resizeTo(s1.width, s1.height);
        
        adFrame.style.top = p1.y + 'px';
        adFrame.style.left = p1.x + 'px';
        adFrame.style.width = p1.width + 'px';
        adFrame.style.height = p1.height + 'px';
        
        if (!getSupports([FEATURES.ORIENTATION])) {
            broadcastEvent('info', 'Device does not support orientation events');
        } else {
            adBridge.pushChange({ screenSize:screenSize, orientation:orientation });
        }
    };
    
    ormmaview.setHeading = function(newHeading) {
        if (!getSupports(FEATURES.HEADING)) {
            broadcastEvent('error', 'Device does not support compass heading events');
        } else if (!active[EVENTS.HEADINGCHANGE]) {
            broadcastEvent('error', 'Compass heading events not currently active');
        } else if (heading == newHeading) {
            broadcastEvent('error', 'Compass heading has not changed');
        } else {
            heading = newHeading;
            adBridge.pushChange({ heading:heading });
        }
    };
    
    ormmaview.setKeyboard = function(visible) {
        if (!active[EVENTS.KEYBOARDCHANGE]) {
            broadcastEvent('error', 'Keyboard events not currently active');
        } else if (keyboardState == visible) {
            broadcastEvent('error', 'Keyboard has not changed');
        } else {
            keyboardState = visible;
            adBridge.pushChange({ keyboardState:keyboardState });
        }
    };
    
    ormmaview.setLocation = function(latitude, longitude, accuracy) {
        if (!getSupports(FEATURES.LOCATION)) {
            broadcastEvent('error', 'Device does not support location events');
        } else if (!active[EVENTS.LOCATIONCHANGE]) {
            broadcastEvent('error', 'Location events not currently active');
        } else if (location && (location.lat == latitude && location.lon == longitude && location.acc == accuracy)) {
            broadcastEvent('error', 'Location has not changed');
        } else {
            location = { lat:latitude, lon:longitude, acc:accuracy };
            adBridge.pushChange({ location:location });
        }
    };
    
    ormmaview.setNetworkStatus = function(status) {
        if (!getSupports(FEATURES.NETWORK)) {
            broadcastEvent('error', 'Device does not support network events');
        } else if (!active[EVENTS.NETWORKCHANGE]) {
            broadcastEvent('error', 'Network events not currently active');
        } else if (network == status) {
            broadcastEvent('error', 'Network status has not changed');
        } else {
            network = status;
            adBridge.pushChange({ network:network });
        }
    };
    
    ormmaview.sendShake = function() {
        if (!getSupports(FEATURES.SHAKE)) {
            broadcastEvent('error', 'Device does not support shake events');
        } else if (!active[EVENTS.SHAKE]) {
            broadcastEvent('error', 'Shake events not currently active');
        } else {
            adBridge.pushShake();
        }
    };
    
    ormmaview.setTilt = function(x, y, z) {
        if (!getSupports(FEATURES.TILT)) {
            broadcastEvent('error', 'Device does not support tilt events');
        } else if (!active[EVENTS.TILTCHANGE]) {
            broadcastEvent('error', 'Tilt events not currently active');
        } else if (tilt && (tilt.x == x && tilt.y == y && tilt.z == z)) {
            broadcastEvent('error', 'Tilt has not changed');
        } else {
            tilt = { x:x, y:y, z:z };
            adBridge.pushChange({ tilt:tilt });
        }
    };
    
    // PUBLIC ACTION METHODS ///////////////////////////////////////////////////////////////
    
    ormmaview.render = function() {
        broadcastEvent('info', 'rendering');
        
        if (!adFrame || !adWindow || !adWindow.document ||
                !adFrame.contentWindow) {
            broadcastEvent('info', 'creating adWindow');
            adWindow = window.open('safari/device.html', 'adWindow', 'left=1000,width='+screenSize.width+',height='+screenSize.height+',menubar=no,location=no,toolbar=no,status=no,personalbar=no,resizable=no,scrollbars=no,chrome=no,all=no');
            adWindow.onload = function() {
            	broadcastEvent('info', 'adWindow loaded');
                adWindowAdj.x = window.outerWidth - screenSize.width;
                adWindowAdj.y = window.outerHeight - screenSize.height;
                if (template != '') adWindow.document.getElementsByTagName('title')[0].text = template;
                adFrame = adWindow.document.getElementById('adFrame');
                loadAd();
            };
        } else {
            loadAd();
        }
    };
    
    // PRIVATE METHODS ///////////////////////////////////////////////////////////////
    
    var clone = function(obj) {
        var f = function() {};
        f.prototype = obj;
        return new f();
    };
    
    var stringify = function(obj) {
        if (typeof obj == 'object') {
            if (obj.push) {
                var out = [];
                for (var p = 0; p < obj.length; p++) {
                    out.push(obj[p]);
                }
                return '[' + out.join(',') + ']';
            } else {
                var out = [];
                for (var p in obj) {
                    out.push('\''+p+'\':'+obj[p]);
                }
                return '{' + out.join(',') + '}';
            }
        } else {
            return String(obj);
        }
    };
    
    var reset = function() {
        adContent = '';
        adBridge = null;
        adController = null;
        adFrame.style.display = 'block';
        intervalID = null;
        timeoutID = null;
        active = {};
        size.width = defaultPosition.width;
        size.height = defaultPosition.height;
        previousPosition = { x:0, y:0, width:0, height:0 };
        previousState = null;
        state = STATES.DEFAULT;
        expandProperties = { width:0, height:0, useCustomClose:false, isModal:false, useBackground:false, backgroundColor:0xffffff, backgroundOpacity:1.0},
        heading = -1;
        keyboardState = false;
        location = null;
        network = NETWORK.UNKNOWN;
        orientation = (screenSize.width >= screenSize.height)?90:0;
        shakeProperties = null;
        tilt = null;
        assets = {};
        cacheRemaining = -1;
    };
    
	var showMraidCloseButton = function(toggle) {
		if (!adFrame.contentWindow.ormmaview.scriptFound) return;
		 
		var doc = adFrame.contentWindow.document;
		var	closeDiv = doc.getElementById('_mraidCloseDiv');
		var	targetDiv;
			
		closeDiv.style.position = 'absolute';
		closeDiv.style.left = (maxSize.width - 50) + 'px';
		closeDiv.style.top = '0px'
		closeDiv.style.width = '50px'
		closeDiv.style.height = '50px';
		closeDiv.style.display = 'none';
		closeDiv.style.zIndex = 999999;
		closeDiv.style.cursor = 'pointer';

		if (!adFrame.contentWindow.mraid.getExpandProperties().useCustomClose) {
			closeDiv.style.background = 'red';
			closeDiv.style.color = 'white';
			closeDiv.style.textAlign = 'center';
			closeDiv.innerHTML = 'close';
		}
	
		if (toggle) {
			closeDiv.style.display = 'block';		
			broadcastEvent ('info', 'adding MRAID close button');
		} else {
			closeDiv.style.display = 'none';
			broadcastEvent ('info', 'removing MRAID close button');
		}
		/* @todo: ad not closing when user clicks the MRAID close button */
	};
	
    var loadAd = function() {
        reset();
        
        timeoutID = window.setTimeout(function() {
            adWindow.clearInterval(intervalID);
            broadcastEvent('error', 'Ad render timed out!');
        }, 10000);
        
        if (adFrame.attachEvent) adFrame.attachEvent("onload", initAdFrame); else adFrame.onload = initAdFrame;
        
        resizeAd(defaultPosition);
        
		if (useHtml) {
			var doc = adFrame.contentWindow.document;
			doc.body.innerHTML = '<body style="margin: 0px;"><div id="_mraidCloseDiv" onclick="mraid.close()"></div>'+adHtml+'</body>';
			doc.body.style.margin = '0px';
			
			var scripts = doc.body.getElementsByTagName("script");
			var scriptsCount=scripts.length;
			for (var i=0; i<scriptsCount; i++){
				var script = doc.createElement('script');
				script.type = "text/javascript";
				if (scripts[i].src !== '') {
					script.src = scripts[i].src;
				} else {
					script.text = scripts[i].text;
				}
				doc.body.appendChild(script);
			}
			initAdFrame();
		} else {
			if (adURIFragment) {
				document.cookie = 'uri='+encodeURIComponent(adURI);
				adFrame.contentWindow.location.replace('ad.html');
			} else {
				adFrame.contentWindow.location.replace(adURI);
			}
		}	
    };
    
    var resizeAd = function(position) {
        adFrame.style.left = position.x + 'px';
        adFrame.style.top = position.y + 'px';
        adFrame.style.width = position.width + 'px';
        adFrame.style.height = position.height + 'px';
    };
    
    var getSupports = function(feature) {
        for (var i=0; i<supports.length; i++) {
			if (supports[i] == feature) return true;
		}
        return false;
    };
    
    var initAdBridge = function(bridge, controller) {
        broadcastEvent('info', 'initializing bridge object ' + bridge);
        
        adBridge = bridge;
        adController = controller;
        
        bridge.addEventListener('activate', function(service) {
            active[service] = true;
        }, this);
    
        bridge.addEventListener('deactivate', function(service) {
            if (active[service]) {
                active[service] = false;
            }
        }, this);
        
        bridge.addEventListener('expand', function(dimensions, URL) {
            previousPosition = { x:parseInt(adFrame.style.left), y:parseInt(adFrame.style.top), width:parseInt(adFrame.style.width), height:parseInt(adFrame.style.height) };
            previousState = state;
            console.log('previous state: ' + previousState);
            console.log('previous position: ' + previousPosition.x + ',' + previousPosition.y + ' ' + previousPosition.width + 'x' + previousPosition.height);
            size = { width:dimensions.width, height:dimensions.height };
            state = STATES.EXPANDED;
            resizeAd(dimensions);
			showMraidCloseButton(true);
            adBridge.pushChange({ size:size, state:state });
        }, this);
        
        bridge.addEventListener('close', function() {
            size = { width:previousPosition.width, height:previousPosition.height };
            state = previousState;
            resizeAd(previousPosition);
			showMraidCloseButton(false);
            adBridge.pushChange({ size:size, state:state });
        }, this);
        
        bridge.addEventListener('hide', function() {
            adFrame.style.display = 'none';
            previousState = state;
            state = STATES.HIDDEN;
            adBridge.pushChange({ state:state });
        }, this);
        
        bridge.addEventListener('show', function() {
            adFrame.style.display = 'block';
            state = previousState;
            adBridge.pushChange({ state:state });
        }, this);
        
        bridge.addEventListener('open', function(URL, controls) {
            broadcastEvent('info', 'opening ' + URL + ' with controls ' + stringify(controls));
            alert('Opening New Page\nURL:'+URL);
        }, this);
        
        bridge.addEventListener('resize', function(width, height) {
            previousPosition = { x:parseInt(adFrame.style.left), y:parseInt(adFrame.style.top), width:parseInt(adFrame.style.width), height:parseInt(adFrame.style.height) };
            previousState = state;
            size = { width:width, height:height };
            state = STATES.RESIZED;
            resizeAd({ x:parseInt(adFrame.style.left), y:parseInt(adFrame.style.top), width:width, height:height });
            adBridge.pushChange({ state:state, size:size });
        }, this);
        
        bridge.addEventListener('setExpandProperties', function(properties) {
            broadcastEvent('info', 'setting expand properties to ' + stringify(properties));
			adBridge.pushChange({'expandProperties':properties});
        }, this);
        
        bridge.addEventListener('createEvent', function(date, title, body) {
            broadcastEvent('info', 'creating event ' + title + ' on ' + date + ':\n' + body);
            alert('Creating Calendar Event\nTitle:'+title+'\nOn:'+date+'\n\n'+body);
        }, this);
        
        bridge.addEventListener('makeCall', function(number) {
            broadcastEvent('info', 'calling ' + number);
            alert('Calling '+number);
        }, this);
        
        bridge.addEventListener('sendMail', function(recipient, subject, body) {
            broadcastEvent('info', 'sending mail ' + subject + ' to ' + recipient + ':\n\n' + body);
            alert('Sending Email\nTo:'+recipient+'\nSubject:'+subject+'\n'+body);
        }, this);
        
        bridge.addEventListener('sendSMS', function(recipient, body) {
            broadcastEvent('info', 'sending SMS to ' + recipient + ':\n' + body);
            alert('Sending SMS\nTo:'+recipient+'\n\n'+body);
        }, this);
        
        bridge.addEventListener('setShakeProperties', function(properties) {
            broadcastEvent('info', 'setting shake properties to ' + stringify(properties));
        }, this);
        
        bridge.addEventListener('request', function(uri, display) {
            broadcastEvent('info', 'requesting ' + uri + ' with display ' + display);
        }, this);
        
        controller.addEventListener('info', function(message) {
            broadcastEvent('info', message);
        }, this);
        
        controller.addEventListener('error', function(message) {
            broadcastEvent('error', message);
        }, this);
        
        var initProps = {
			state:STATES.LOADING,
            screenSize:screenSize,
            orientation:orientation,
            size:size,
            defaultPosition:defaultPosition,
            maxSize:maxSize,
            expandProperties:expandProperties,
            supports:supports
        };
        if (shakeProperties) initProps.shakeProperties = shakeProperties;
        bridge.pushChange(initProps);
		bridge.pushChange({ state:state });
    };
    
    var initAdFrame = function() {
        broadcastEvent('info', 'initializing ad frame');
        
        win = adFrame.contentWindow;
        doc = win.document;
        
        var bridgeJS = doc.createElement('script');
        bridgeJS.setAttribute('type', 'text/javascript');
		bridgeJS.setAttribute('src', 'ormmaview-bridge.js');
        doc.getElementsByTagName('head')[0].appendChild(bridgeJS);
        
        intervalID = win.setInterval(function() {
            if (win.ormmaview) {
                win.clearInterval(intervalID);
                
                var ormmaJS = doc.createElement('script');
                ormmaJS.setAttribute('type', 'text/javascript');
                ormmaJS.setAttribute('src', 'ormma.js');
                doc.getElementsByTagName('head')[0].appendChild(ormmaJS);
				
                intervalID = win.setInterval(function() {
                    if (win.ormma) {
                        win.clearInterval(intervalID);
                        window.clearTimeout(timeoutID);
                        initAdBridge(win.ormmaview, win.ormma);
                    }
                }, 30);
            }
        }, 30);
    };
})();
