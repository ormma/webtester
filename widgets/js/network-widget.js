/*
 *  Copyright (c) 2011 The ORMMA.org project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

networkWidget = {
	timer: null,
	interval: null,
	
	init : function() {
		networkWidget.setNetwork();
		$("#networkToggle").bind("click", networkWidget.toggleNetwork);
		$("#networkState").bind("change", networkWidget.setNetwork);
	},
	
	setNetwork : function() {
		var jEl = $("#networkToggle"),
			val = $("#networkState").val();
		jEl.removeClass("networkUNKNOWN");
		jEl.removeClass("networkOFFLINE");
		jEl.removeClass("networkCELL");
		jEl.removeClass("networkWIFI");
		jEl.removeClass("up");
		jEl.addClass("network" + val);
		ormmaview.setNetworkStatus(val);
	},
	
	toggleNetwork : function() {
		var newClass,
			val,
			jEl = $("#networkToggle");
		if (jEl.hasClass("networkUNKNOWN")) {
			jEl.removeClass("networkUNKNOWN");
			jEl.addClass("up");
			newClass = "networkOFFLINE";
		}
		if (jEl.hasClass("networkOFFLINE")) {
			jEl.removeClass("networkOFFLINE");
			if (jEl.hasClass("up")) {
				newClass = "networkCELL";
			} else {
				newClass = "networkUNKNOWN";
			}
		}
		if (jEl.hasClass("networkCELL")) {
			jEl.removeClass("networkCELL");
			if (jEl.hasClass("up")) {
				newClass = "networkWIFI";
			} else {
				newClass = "networkOFFLINE";
			}
		}
		if (jEl.hasClass("networkWIFI")) {
			jEl.removeClass("networkWIFI");
			jEl.removeClass("up");
			newClass = "networkCELL";
		}
		$("#networkToggle").addClass(newClass);
		val = newClass.replace("network","");
		$("#networkState").val(val);
		ormmaview.setNetworkStatus(val);
	},
	
	toggleNetworkTiming : function() {
		var state = $("#networkTiming").attr("class");
		if (state==='t-off') {
			networkWidget.timer = prompt("Enter number of milliseconds to update network state", 1000);
			networkWidget.interval = setInterval(networkWidget.toggleNetwork, networkWidget.timer);
			$("#networkTiming").attr("class", "t-on");
		} else {
			clearInterval(networkWidget.interval);
			$("#networkTiming").attr("class", "t-off");
		}
	}
}