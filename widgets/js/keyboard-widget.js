/*
 *  Copyright (c) 2011 The ORMMA.org project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

keyboardWidget = {
	timer: null,
	interval: null,
	
	init : function(){
		$("#keyboardToggle").bind("click", keyboardWidget.toggleKeyboard);
		$("#keyboardState").bind("change", keyboardWidget.setKeyboard);
		$("#keyboardState").val("down");
	},
	
	toggleKeyboard : function() {
		$("#keyboardToggle").toggleClass("up");
		if ($("#keyboardToggle").hasClass("up")) {
			$("#keyboardState").val("up");
		} else {
			$("#keyboardState").val("down");
		}
		ormmaview.setKeyboard($("#keyboardState").val() === "up");
	},
	
	setKeyboard : function() {
		if ($("#keyboardState").val() === "down") {
			$("#keyboardToggle").removeClass("up");
		} else {
			$("#keyboardToggle").addClass("up");
		}
		ormmaview.setKeyboard($("#keyboardState").val() === "up");
	},
	

	toggleKeyboardTiming : function() {
		var state = $("#keyboardTiming").attr("class");
		if (state==='t-off') {
			keyboardWidget.timer = prompt("Enter number of milliseconds to toggle keyboard up and down", 1000);
			keyboardWidget.interval = setInterval(keyboardWidget.toggleKeyboard, keyboardWidget.timer);
			$("#keyboardTiming").attr("class","t-on");
		} else {
			clearInterval(keyboardWidget.interval);
			$("#keyboardTiming").attr("class","t-off");
		}
	}
}