/*
 *  Copyright (c) 2011 The ORMMA.org project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

locationWidget = {
	timer: null,
	interval: null,
	timerLatStep: null,
	timerLngStep: null,
	
	latZero : 65.5,
	latStepPerPixel : 180/145,
	lngZero : 102.5,
	lngStepPerPixel : 360/211,
	
	init : function() {
		$("#lat").bind("change", locationWidget.updateMapFromLatLng);
		$("#lng").bind("change", locationWidget.updateMapFromLatLng);
	
		$("#location-target").draggable();
		$("#location-target").draggable("option", "containment", 'parent');
		$("#location-target").draggable("option", "cursor", 'crosshair');
		locationWidget.updateLatLngFromMap($("#location-target").css("top"), $("#location-target").css("left"));
		
		$("#location-target").bind( "drag", function(evt, ui) {
		  locationWidget.updateLatLngFromMap(ui.position.top, ui.position.left);
		})
	},
	
	updateLatLngFromMap : function(top, left) {
		var lat = (locationWidget.latZero - parseFloat(top)) * locationWidget.latStepPerPixel,
			lng = -(locationWidget.lngZero - parseFloat(left)) * locationWidget.lngStepPerPixel;
			
		$("#lat").val(lat);
		$("#lng").val(lng);
		
		ormmaview.setLocation(lat, lng, $("#accuracy").val());
	},
	
	updateMapFromLatLng : function() {
		var lat = $("#lat").val(),
			lng = $("#lng").val(),
			top = locationWidget.latZero - (lat / locationWidget.latStepPerPixel),
			left = locationWidget.lngZero + (lng / locationWidget.lngStepPerPixel);
console.log("updating to " + top + ", " + left);			
		$("#location-target").css("top", top);
		$("#location-target").css("left", left);
		
		ormmaview.setLocation(lat, lng, $("#accuracy").val());
	},
	
	timerUpdateLocation : function() {
		var lat = parseFloat($("#lat").val()) + locationWidget.timerLatStep,
			lng = parseFloat($("#lng").val()) + locationWidget.timerLngStep;
		if (lat>90) {
			lat = lat-180;
		} else if (lat<-90) {
			lat = lat+180;
		}
		if (lng>180) {
			lng = lng-360;
		} else if (lng<-180) {
			lng = lng+360;
		}
		$("#lat").val(lat);
		$("#lng").val(lng);
		locationWidget.updateMapFromLatLng();
	},
	
	toggleLocationTiming : function() {
		var state = $("#locationTiming").attr("class");
		if (state==='t-off') {
			locationWidget.timer = prompt("Enter number of milliseconds to update location", 1000);
			locationWidget.timerLatStep = parseFloat(prompt("Enter number of degrees to change latitude with each update", .1));
			locationWidget.timerLngStep = parseFloat(prompt("Enter number of degrees to change longitude with each update", .1));
			locationWidget.interval = setInterval(locationWidget.timerUpdateLocation, locationWidget.timer);
			$("#locationTiming").attr("class","t-on");
		} else {
			clearInterval(locationWidget.interval);
			$("#locationTiming").attr("class","t-off");
		}
	}
}