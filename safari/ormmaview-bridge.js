/*
 *  Copyright (c) 2011 The ORMMA.org project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

(function() {
    var ormmaview = window.ormmaview = {};
    
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
    
    ormmaview.pushChange = function(obj) {
        broadcastEvent('change', obj);
    };
    ormmaview.pushShake = function() {
        broadcastEvent('shake');
    };
    ormmaview.pushError = function(message, action) {
        broadcastEvent('error', message, action);
    };
    ormmaview.pushResponse = function(uri, response) {
        broadcastEvent('response', uri, response);
    };
    ormmaview.pushAssetReady = function(alias, URL) {
        broadcastEvent('assetReady', alias, URL);
    };
    ormmaview.pushAssetRemoved = function(alias) {
        broadcastEvent('assetRemoved', alias);
    };
    ormmaview.pushAssetRetired = function(alias) {
        broadcastEvent('assetRetired', alias);
    };
    
    ormmaview.activate = function(service) {
        broadcastEvent('activate', service);
    };
    ormmaview.deactivate = function(service) {
        broadcastEvent('deactivate', service);
    };
    ormmaview.expand = function(dimensions, URL) {
        broadcastEvent('expand', dimensions, URL);
    };
    ormmaview.close = function() {
        broadcastEvent('close');
    };
    ormmaview.hide = function() {
        broadcastEvent('hide');
    };
    ormmaview.show = function() {
        broadcastEvent('show');
    };
    ormmaview.open = function(URL, controls) {
        broadcastEvent('open', URL, controls);
    };
    ormmaview.resize = function(width, height) {
        broadcastEvent('resize', width, height);
    };
    ormmaview.setExpandProperties = function(properties) {
        broadcastEvent('setExpandProperties', properties);
    };
    ormmaview.createEvent = function(date, title, body) {
        broadcastEvent('createEvent', date, title, body);
    };
    ormmaview.makeCall = function(number) {
        broadcastEvent('makeCall', number);
    };
    ormmaview.sendMail = function(recipient, subject, body) {
        broadcastEvent('sendMail', recipient, subject, body);
    };
    ormmaview.sendSMS = function(recipient, body) {
        broadcastEvent('sendSMS', recipient, body);
    };
    ormmaview.setShakeProperties = function(properties) {
        broadcastEvent('setShakeProperties', properties);
    };
    ormmaview.addAsset = function(URL, alias) {
        broadcastEvent('addAsset', URL, alias);
    };
    ormmaview.request = function(uri, display) {
        broadcastEvent('request', uri, display);
    };
    ormmaview.removeAsset = function(alias) {
        broadcastEvent('removeAsset', alias);
    };
})();