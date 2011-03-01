compassWidget = {
	timer: null,
	interval: null,
	timerStep: null,
	
	radius : 50,
	offsetX : 15,
	offsetY : 65,
	imageRadius : 10,
	centerX : 0,
	centerY : 0,

	init : function() {
		compassWidget.centerX = compassWidget.offsetX + compassWidget.radius + compassWidget.imageRadius;
		compassWidget.centerY = compassWidget.offsetY + compassWidget.imageRadius;
	
		$("#compass").bind("change", compassWidget.updateCompassFromHeading);
		compassWidget.updateHeadingFromCompass($("#compass-dot").css("top"), $("#compass-dot").css("left"));
	
		$('#compass-dot').bind('drag',function( event ){
			var angle = Math.atan2( event.pageX - document.getElementById("compass-widget").offsetLeft - compassWidget.centerX, event.pageY - document.getElementById("compass-widget").offsetTop - compassWidget.centerY );
			$("#compass-dot").css("top", compassWidget.centerY + Math.cos( angle )*compassWidget.radius - compassWidget.imageRadius);
			$("#compass-dot").css("left", compassWidget.centerX + Math.sin( angle )*compassWidget.radius - compassWidget.imageRadius);
			compassWidget.updateHeadingFromCompass(angle);
         })	
	},

	updateHeadingFromCompass : function(angle) {
		var degrees = Math.abs(180-(angle * (180 / Math.PI)));
		if (isNaN(degrees)) degrees = 0;
		$("#compass").val(degrees);
		
		ormmaview.setHeading(degrees);
		tiltWidget.updateYawFromCompass(degrees);
	},
	
	updateCompassFromHeading : function(doNotPropogate) {
		if (compassWidget.centerX === 0) return;
		
		var angle,
			val = 180 - $("#compass").val();
			if (val <0) val+=360;
			angle = (val*(Math.PI/180));
		
		$("#compass-dot").css("top", compassWidget.centerY + Math.cos( angle )*compassWidget.radius - compassWidget.imageRadius);
		$("#compass-dot").css("left", compassWidget.centerX + Math.sin( angle )*compassWidget.radius - compassWidget.imageRadius);
		
		ormmaview.setHeading(val);
		if (doNotPropogate===true) return;
		tiltWidget.updateYawFromCompass(val);
	},
	
	timerUpdateCompass : function() {
		var val = parseFloat($("#compass").val());
		val += compassWidget.timerStep;
		if (val>=360) val = val-360;
		if (val<0) val = val+360;
		$("#compass").val(val);
		compassWidget.updateCompassFromHeading();
	},
	
	toggleCompassTiming : function() {
		var state = $("#compassTiming").attr("class");
		if (state==='t-off') {
			compassWidget.timer = prompt("Enter number of milliseconds to update compass heading", 1000);
			compassWidget.timerStep = parseFloat(prompt("Enter number of degrees to change with each update", 10));
			compassWidget.interval = setInterval(compassWidget.timerUpdateCompass, compassWidget.timer);
			$("#compassTiming").attr("class","t-on");
		} else {
			clearInterval(compassWidget.interval);
			$("#compassTiming").attr("class","t-off");
		}
	},
	
	updateCompassFromYaw : function (yaw) {
		var degrees = 360-yaw;
		$("#compass").val(degrees);
		compassWidget.updateCompassFromHeading(true);
	}
}

