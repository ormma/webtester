/*
 *  Copyright (c) 2011 The ORMMA.org project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

(function() {
    var ormma = window.ormma = {};
	var mraid = window.mraid = {};
    
    // CONSTANTS ///////////////////////////////////////////////////////////////
    
    var STATES = ormma.STATES = {
        UNKNOWN     :'unknown',
		LOADING		:'loading',
        DEFAULT     :'default',
        RESIZED     :'resized',
        EXPANDED    :'expanded',
        HIDDEN      :'hidden'
    };
	mraid.STATES = {
		LOADING		:'loading',
        DEFAULT     :'default',
        EXPANDED    :'expanded',
        HIDDEN      :'hidden'	
	};
    
    var EVENTS = ormma.EVENTS = {
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
	mraid.EVENTS = {
		READY				:'ready',
        ERROR               :'error',
        INFO                :'info',
        STATECHANGE         :'stateChange',
 		VIEWABLECHANGE		:'viewableChange'
	};
    
    var FEATURES = ormma.FEATURES = {
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
    
    var NETWORK = ormma.NETWORK = {
        OFFLINE :'offline',
        WIFI    :'wifi',
        CELL    :'cell',
        UNKNOWN :'unknown'
    };
    
    // PRIVATE PROPERTIES (sdk controlled) //////////////////////////////////////////////////////
    
    var state = STATES.UNKNOWN;
    
    var size = {
        width:0,
        height:0
    };
    
    var defaultPosition = {
        x:0,
        y:0,
        width:0,
        height:0
    };
    
    var maxSize = {
        width:0,
        height:0
    };
    
    var expandProperties = {
		width:0,
		height:0,
		useCustomClose:false,
		isModal:true,
        useBackground:false,
        backgroundColor:0xffffff,
        backgroundOpacity:1.0
    };
    
    var supports = {
        'level-1':true,
        'level-2':true,
        'screen':true,
        'orientation':true,
        'heading':true,
        'location':true,
        'shake':true,
        'tilt':true,
        'network':true,
        'sms':true,
        'phone':true,
        'email':true,
        'calendar':true,
        'camera':true,
		'map':true,
		'audio':true,
		'video':true
    };
    
    var heading = -1;
    
    var keyboardState = false;
    
    var location = null;
    
    var network = NETWORK.UNKNOWN;
    
    var orientation = -1;
    
    var screenSize = null;
    
    var shakeProperties = null;
    
    var tilt = null;
    
    var assets = {};
    
    var cacheRemaining = -1;
    
    // PRIVATE PROPERTIES (internal) //////////////////////////////////////////////////////
    
    var intervalID = null;
    var timeoutID = null;
    var readyTimeout = 10000;
	var readyInterval = 750;
    
	//@TODO: don't think I need dimension validators anymore
    var dimensionValidators = {
        x:function(value) { return !isNaN(value); },
        y:function(value) { return !isNaN(value); },
        width:function(value) { return !isNaN(value) && value >= 0; },
        height:function(value) { return !isNaN(value) && value >= 0; }
    };
    
	//@TODO: ok to allow ads that are larger than maxSize
    var sizeValidators = {
        width:function(value) { return !isNaN(value) && value >= 0 && value <= maxSize.width; },
        height:function(value) { return !isNaN(value) && value >= 0 && value <= maxSize.height; }
    };
    
	//@TODO: there are more expand properties
    var expandPropertyValidators = {
        useBackground:function(value) { return (value === true || value === false); },
        backgroundColor:function(value) { return (typeof value == 'string' && value.substr(0,1) == '#' && !isNaN(parseInt(value.substr(1), 16))); },
        backgroundOpacity:function(value) { return !isNaN(value) && value >= 0 && value <= 1; },
        isModal:function(value) { return (value === true || value === false); },
		useCustomClose:function(value) { return (value === true || value === false); }, 
		width:function(value) { return !isNaN(value) && value >= 0; }, 
		height:function(value) { return !isNaN(value) && value >= 0; }	
    };
    
    var shakePropertyValidators = {
        intensity:function(value) { return !isNaN(value); },
        interval:function(value) { return !isNaN(value); }
    };
    
    var changeHandlers = {
        state:function(val) {
            if (state == STATES.UNKNOWN && val != STATES.UNKNOWN) {
                broadcastEvent(EVENTS.INFO, 'controller initialized');
            }
			if (state == STATES.LOADING && val != STATES.LOADING) {
                timeoutID = window.setTimeout(ormma.readyTimeout, readyTimeout);
                intervalID = window.setInterval(ormma.signalReady, readyInterval);
                broadcastEvent(EVENTS.INFO, 'controller ready, attempting callback');
			} else {
				broadcastEvent(EVENTS.INFO, 'setting state to ' + stringify(val));
				state = val;
				broadcastEvent(EVENTS.STATECHANGE, state);
			}
        },
        size:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting size to ' + stringify(val));
            size = val;
            broadcastEvent(EVENTS.SIZECHANGE, size.width, size.height);
        },
        defaultPosition:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting default position to ' + stringify(val));
            defaultPosition = val;
        },
        maxSize:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting maxSize to ' + stringify(val));
            maxSize = val;
        },
        expandProperties:function(val) {
            broadcastEvent(EVENTS.INFO, 'merging expandProperties with ' + stringify(val));
            for (var i in val) {
                expandProperties[i] = val[i];
            }
        },
        supports:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting supports to ' + stringify(val));
            supports = {};
            for (var key in FEATURES) {
                supports[FEATURES[key]] = contains(FEATURES[key], val);
            }
        },
        heading:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting heading to ' + stringify(val));
            heading = val;
            broadcastEvent(EVENTS.HEADINGCHANGE, heading);
        },
        keyboardState:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting keyboardState to ' + stringify(val));
            keyboardState = val;
            broadcastEvent(EVENTS.KEYBOARDCHANGE, keyboardState);
        },
        location:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting location to ' + stringify(val));
            location = val;
            broadcastEvent(EVENTS.LOCATIONCHANGE, location.lat, location.lon, location.acc);
        },
        network:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting network to ' + stringify(val));
            network = val;
            broadcastEvent(EVENTS.NETWORKCHANGE, (network != NETWORK.OFFLINE && network != NETWORK.UNKNOWN), network);
        },
        orientation:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting orientation to ' + stringify(val));
            orientation = val;
            broadcastEvent(EVENTS.ORIENTATIONCHANGE, orientation);
        },
        screenSize:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting screenSize to ' + stringify(val));
            screenSize = val;
            broadcastEvent(EVENTS.SCREENCHANGE, screenSize.width, screenSize.height);
        },
        shakeProperties:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting shakeProperties to ' + stringify(val));
            shakeProperties = val;
        },
        tilt:function(val) {
            broadcastEvent(EVENTS.INFO, 'setting tilt to ' + stringify(val));
            tilt = val;
            broadcastEvent(EVENTS.TILTCHANGE, tilt.x, tilt.y, tilt.z);
        }
    };
    
    var listeners = {};
    
    var EventListeners = function(event) {
        this.event = event;
        this.count = 0;
        var listeners = {};
        
        this.add = function(func) {
            var id = String(func);
            if (!listeners[id]) {
                listeners[id] = func;
                this.count++;
                if (this.count == 1) {
                    broadcastEvent(EVENTS.INFO, 'activating ' + event);
                    ormmaview.activate(event);
                }
            }
        };
        this.remove = function(func) {
            var id = String(func);
            if (listeners[id]) {
                listeners[id] = null;
                delete listeners[id];
                this.count--;
                if (this.count == 0) {
                    broadcastEvent(EVENTS.INFO, 'deactivating ' + event);
                    ormmaview.deactivate(event);
                }
                return true;
            } else {
                return false;
            }
        };
        this.removeAll = function() { for (var id in listeners) this.remove(listeners[id]); };
        this.broadcast = function(args) { for (var id in listeners) listeners[id].apply({}, args); };
        this.toString = function() {
            var out = [event,':'];
            for (var id in listeners) out.push('|',id,'|');
            return out.join('');
        };
    };
    
    // PRIVATE METHODS ////////////////////////////////////////////////////////////
    
    ormmaview.addEventListener('change', function(properties) {
        for (var property in properties) {
            var handler = changeHandlers[property];
            handler(properties[property]);
        }
    });
    
    ormmaview.addEventListener('shake', function() {
        broadcastEvent(EVENTS.SHAKE);
    });
    
    ormmaview.addEventListener('error', function(message, action) {
        broadcastEvent(EVENTS.ERROR, message, action);
    });
    
    ormmaview.addEventListener('response', function(uri, response) {
        broadcastEvent(EVENTS.RESPONSE, uri, response);
    });
    
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
    
    var valid = function(obj, validators, action, full) {
        if (full) {
            if (obj === undefined) {
                broadcastEvent(EVENTS.ERROR, 'Required object missing.', action);
                return false;
            } else {
                for (var i in validators) {
                    if (obj[i] === undefined) {
                        broadcastEvent(EVENTS.ERROR, 'Object missing required property ' + i, action);
                        return false;
                    }
                }
            }
        }
        for (var i in obj) {
            if (!validators[i]) {
                broadcastEvent(EVENTS.ERROR, 'Invalid property specified - ' + i + '.', action);
                return false;
            } else if (!validators[i](obj[i])) {
                broadcastEvent(EVENTS.ERROR, 'Value of property ' + i + ' is not valid type.', action);
                return false;
            }
        }
        return true;
    };
    
    var contains = function(value, array) {
        for (var i in array) if (array[i] == value) return true;
        return false;
    };
    
    var broadcastEvent = function() {
        var args = new Array(arguments.length);
        for (var i = 0; i < arguments.length; i++) args[i] = arguments[i];
        var event = args.shift();
        if (listeners[event]) listeners[event].broadcast(args);
    }
    
    // LEVEL 1 ////////////////////////////////////////////////////////////////////
    
    ormma.readyTimeout = function() {
        window.clearInterval(intervalID);
        window.clearTimeout(timeoutID);
        if (!ormmaview.scriptFound) {
			broadcastEvent(EVENTS.INFO, 'No ORMMAReady callback found (timeout of ' + readyTimeout + 'ms occurred), assume use of ready eventListener.');
		}
    };
    
    ormma.signalReady = function() {
		broadcastEvent(EVENTS.INFO, 'setting state to ' + stringify(STATES.DEFAULT));
		state = STATES.DEFAULT;
		broadcastEvent(EVENTS.STATECHANGE, state);
		
		broadcastEvent(EVENTS.INFO, 'ready eventListener triggered');
		broadcastEvent(EVENTS.READY, 'ormma ready event triggered');
		broadcastEvent(mraid.EVENTS.READY, 'mraid ready event triggered');
        window.clearInterval(intervalID);
        try {
            ORMMAReady();
            window.clearTimeout(timeoutID);
            broadcastEvent(EVENTS.INFO, 'ORMMA callback invoked');
        } catch (e) {
			//ignore errors, will try again soon and then timeout
        }
    };
	
    ormma.info = function(message) {
        broadcastEvent(EVENTS.INFO, message);
    };
    
    ormma.error = function(message) {
        broadcastEvent(EVENTS.ERROR, message);
    };
    
    ormma.addEventListener = function(event, listener) {
        if (!event || !listener) {
            broadcastEvent(EVENTS.ERROR, 'Both event and listener are required.', 'addEventListener');
        } else if (!contains(event, EVENTS)) {
			broadcastEvent(EVENTS.ERROR, 'Unknown event: ' + event, 'addEventListener');
        } else {
            if (!listeners[event]) listeners[event] = new EventListeners(event);
            listeners[event].add(listener);
        }
    };
    
    ormma.close = function() {
        ormmaview.close();
    };
    
    ormma.expand = function(dimensions, URL) {
		if (dimensions === undefined) {
			dimensions = {width:ormma.getMaxSize().width, height:ormma.getMaxSize().height, x:0, y:0};
		}
        broadcastEvent(EVENTS.INFO, 'expanding to ' + stringify(dimensions));
        if (valid(dimensions, dimensionValidators, 'expand', true)) {
            ormmaview.expand(dimensions, URL);
        }
    };
    
    ormma.getDefaultPosition = function() {
        return clone(defaultPosition);
    };
    
    ormma.getExpandProperties = function() {
        return clone(expandProperties);
    };
    
    ormma.getMaxSize = function() {
        return clone(maxSize);
    };
    
    ormma.getSize = function() {
        return clone(size);
    };
    
    ormma.getState = function() {
        return state;
    };
    
	ormma.getVersion = function() {
		return ("1.1.0");
	};
	
    ormma.hide = function() {
        if (state == STATES.HIDDEN) {
            broadcastEvent(EVENTS.ERROR, 'Ad is currently hidden.', 'hide');
        } else {
            ormmaview.hide();
        }
    };
    
    ormma.open = function(URL, controls) {
        if (!URL) {
            broadcastEvent(EVENTS.ERROR, 'URL is required.', 'open');
        } else {
            ormmaview.open(URL, controls);
        }
    };
    
    ormma.removeEventListener = function(event, listener) {
        if (!event) {
            broadcastEvent(EVENTS.ERROR, 'Must specify an event.', 'removeEventListener');
        } else {
            if (listener && (!listeners[event] || !listeners[event].remove(listener))) {
                broadcastEvent(EVENTS.ERROR, 'Listener not currently registered for event', 'removeEventListener');
                return;
            } else {
                listeners[event].removeAll();
            }
            if (listeners[event].count == 0) {
                listeners[event] = null;
                delete listeners[event];
            }
        }
    };
    
    ormma.resize = function(width, height) {
        if (width == null || height == null || isNaN(width) || isNaN(height) || width < 0 || height < 0) {
            broadcastEvent(EVENTS.ERROR, 'Requested size must be numeric values between 0 and maxSize.', 'resize');
        } else if (width > maxSize.width || height > maxSize.height) {
            broadcastEvent(EVENTS.ERROR, 'Request (' + width + ' x ' + height + ') exceeds maximum allowable size of (' + maxSize.width +  ' x ' + maxSize.height + ')', 'resize');
        } else if (width == size.width && height == size.height) {
            broadcastEvent(EVENTS.ERROR, 'Requested size equals current size.', 'resize');
        } else {
            ormmaview.resize(width, height);
        }
    };
    
    ormma.setExpandProperties = function(properties) {
        if (valid(properties, expandPropertyValidators, 'setExpandProperties')) {
            ormmaview.setExpandProperties(properties);
        }
    };
    
    // ormma.setResizeProperties = function(properties) {};
    
    ormma.show = function() {
        if (state != STATES.HIDDEN) {
            broadcastEvent(EVENTS.ERROR, 'Ad is currently visible.', 'show');
        } else {
            ormmaview.show();
	        }
    };
	
	ormma.useCustomClose = function() {
		//@TODO
	}
    
    // LEVEL 2 ////////////////////////////////////////////////////////////////////
    
    ormma.createEvent = function(date, title, body) {
        if (!supports[FEATURES.CALENDAR]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'createEvent');
        } else if (!date || typeof date != 'object' || !date.getDate) {
            broadcastEvent(EVENTS.ERROR, 'Valid date required.', 'createEvent');
        } else if (!title || typeof title != 'string') {
            broadcastEvent(EVENTS.ERROR, 'Valid title required.', 'createEvent');
        } else {
            ormmaview.createEvent(date, title, body);
        }
    };
    
    ormma.getHeading = function() {
        if (!supports[FEATURES.HEADING]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getHeading');
        }
        return heading;
    };
    
    ormma.getKeyboardState = function() {
        if (!supports[FEATURES.LEVEL2]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getKeyboardState');
        }
        return keyboardState;
    }
    
    ormma.getLocation = function() {
        if (!supports[FEATURES.LOCATION]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getLocation');
        }
        return (null == location)?null:clone(location);
    };
    
    ormma.getNetwork = function() {
        if (!supports[FEATURES.NETWORK]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getNetwork');
        }
        return network;
    };
    
    ormma.getOrientation = function() {
        if (!supports[FEATURES.ORIENTATION]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getOrientation');
        }
        return orientation;
    };
    
    ormma.getScreenSize = function() {
        if (!supports[FEATURES.SCREEN]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getScreenSize');
        } else {
            return (null == screenSize)?null:clone(screenSize);
        }
    };
    
    ormma.getShakeProperties = function() {
        if (!supports[FEATURES.SHAKE]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getShakeProperties');
        } else {
            return (null == shakeProperties)?null:clone(shakeProperties);
        }
    };
    
    ormma.getTilt = function() {
        if (!supports[FEATURES.TILT]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'getTilt');
        } else {
            return (null == tilt)?null:clone(tilt);
        }
    };
    
    ormma.makeCall = function(number) {
        if (!supports[FEATURES.PHONE]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'makeCall');
        } else if (!number || typeof number != 'string') {
            broadcastEvent(EVENTS.ERROR, 'Request must provide a number to call.', 'makeCall');
        } else {
            ormmaview.makeCall(number);
        }
    };
    
    ormma.sendMail = function(recipient, subject, body) {
        if (!supports[FEATURES.EMAIL]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'sendMail');
        } else if (!recipient || typeof recipient != 'string') {
            broadcastEvent(EVENTS.ERROR, 'Request must specify a recipient.', 'sendMail');
        } else {
            ormmaview.sendMail(recipient, subject, body);
        }
    };
    
    ormma.sendSMS = function(recipient, body) {
        if (!supports[FEATURES.SMS]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'sendSMS');
        } else if (!recipient || typeof recipient != 'string') {
            broadcastEvent(EVENTS.ERROR, 'Request must specify a recipient.', 'sendSMS');
        } else {
            ormmaview.sendSMS(recipient, body);
        }
    };
    
    ormma.setShakeProperties = function(properties) {
        if (!supports[FEATURES.SHAKE]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'setShakeProperties');
        } else if (valid(properties, shakePropertyValidators, 'setShakeProperties')) {
            ormmaview.setShakeProperties(properties);
        }
    };
    
//    ormma.storePicture = function(URL) {};
    
    ormma.supports = function(feature) {
        if (supports[feature]) {
            return true;
        } else {
            return false;
        }
    };
    
    ormma.request = function(uri, display) {
        if (!supports[FEATURES.LEVEL3]) {
            broadcastEvent(EVENTS.ERROR, 'Method not supported by this client.', 'request');
        } else if (!uri || typeof uri != 'string') {
            broadcastEvent(EVENTS.ERROR, 'URI is required.', 'request');
        } else {
            ormmaview.request(uri, display);
        }
    };
	
// MRAID ////////////////////
    mraid.readyTimeout = function() {
        window.clearInterval(intervalID);
        broadcastEvent(EVENTS.ERROR, 'No MRAID ready listener found (timeout of ' + readyTimeout + 'ms occurred)');
    };
    
	mraid.getVersion = function() {
		return ('1.0');
	};
	
    
	mraid.addEventListener = ormma.addEventListener;
	mraid.close = ormma.close;
	mraid.expand = ormma.expand;
	mraid.getExpandProperties = ormma.getExpandProperties;
	mraid.getState = ormma.getState;
	mraid.open = ormma.open;
	mraid.removeEventListener = ormma.removeEventListener;
	mraid.setExpandProperties = ormma.setExpandProperties;
	mraid.useCustomClose = ormma.useCustomClose;

	mraid.error = ormma.error;
	//@TODO: mraid.stateChange
	//@TODO: mraid.ready
	//@TODO: mraid.viewableChange
    
})();