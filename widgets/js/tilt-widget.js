tiltWidget = {
	timer: null,
	interval: null,
	timerAlphaStep : 0,
	timerBetaStep : 0,
	timerGammaStep : 0,
	
	/* alpha range is 0 to 360 */
	alphaCenter : -87.5,
	alphaPixelMax : -150,
	alphaPixelMin : -25,
	alphaMax : 360,
	alphaMin : 0,
	
	/* beta range is -180 to 180 */
	betaCenter : 55,
	betaPixelMax : 0,
	betaPixelMin : 110,
	betaMax : 180,
	betaMin : -180,
	
	/* gamma range is -90 to 90 */
	gammaCenter : 55,
	gammaPixelMax : 110,
	gammaPixelMin : 0,
	gammaMax : 90,
	gammaMin : -90,

	init : function() { 
		$("#gammaValue").bind("change", tiltWidget.updateTiltFromForm);
		$("#betaValue").bind("change", tiltWidget.updateTiltFromForm);
		$("#alphaValue").bind("change", tiltWidget.updateTiltFromForm);
	
		$("#tilt-target").draggable();
		$("#tilt-target").draggable("option", "containment", 'parent');
		$("#tilt-target").draggable("option", "cursor", 'crosshair');
	
		$("#z-marker").draggable();
		$("#z-marker").draggable("option", "axis", 'y');
		$("#z-marker").draggable("option", "containment", 'parent');
		$("#z-marker").draggable("option", "cursor", 'crosshair');
	
		tiltWidget.updateFormFromTilt($("#tilt-target").css("top"), $("#tilt-target").css("left"), $("z-marker").css("top"));
		
		$("#tilt-target").bind( "drag", function(evt, ui) {
		  tiltWidget.updateFormFromTilt(ui.position.top, ui.position.left, $("z-marker").css("top"));
		});
		
		$("#z-marker").bind( "drag", function(evt, ui) {
		  if (ui.position.top>-25) ui.position.top=-25;
		  tiltWidget.updateFormFromTilt($("#tilt-target").css("top"), $("#tilt-target").css("left"), ui.position.top);
		});
	},
	
	updateFormFromTilt : function(top, left, z) {
	
		var pitch = (parseFloat(top ) - tiltWidget.betaCenter ) * ((tiltWidget.betaMax -tiltWidget.betaMin ) / (tiltWidget.betaPixelMin -tiltWidget.betaPixelMax )),
			roll =  (parseFloat(left) - tiltWidget.gammaCenter) * ((tiltWidget.gammaMax-tiltWidget.gammaMin) / (tiltWidget.gammaPixelMin-tiltWidget.gammaPixelMax)),
			yaw = ((parseFloat(z || 180) - tiltWidget.alphaCenter) * ((tiltWidget.alphaMax-tiltWidget.alphaMin) / (Math.abs(tiltWidget.alphaPixelMin)-Math.abs(tiltWidget.alphaPixelMax)))) + 180;
			
		/* Safari doesn't constrain the bottom */
		if (yaw<0) {
			yaw = 0;
			$("#z-marker").css("top", -25);
		}
		
		$("#gammaValue").val(roll);
		$("#betaValue").val(pitch);	
		$("#alphaValue").val(yaw);
		
		ormmaview.setTilt(roll, pitch, yaw);
		compassWidget.updateCompassFromYaw(yaw);
	},
	
	updateTiltFromForm : function(doNotPropogate) {
		var yaw = parseFloat($("#alphaValue").val()),
			pitch = parseFloat($("#betaValue").val()),
			roll = parseFloat($("#gammaValue").val()),
			top  = (pitch*((tiltWidget.betaPixelMin -tiltWidget.betaPixelMax )/(tiltWidget.betaMax -tiltWidget.betaMin )))+tiltWidget.betaCenter,
			left = (roll* ((tiltWidget.gammaPixelMin-tiltWidget.gammaPixelMax)/(tiltWidget.gammaMax-tiltWidget.gammaMin)))+tiltWidget.gammaCenter,
			z = (yaw-180)*((Math.abs(tiltWidget.alphaPixelMin)-Math.abs(tiltWidget.alphaPixelMax))/(tiltWidget.alphaMax-tiltWidget.alphaMin))+tiltWidget.alphaCenter;
					
		$("#z-marker").css("top", z);
		$("#tilt-target").css("top", top);
		$("#tilt-target").css("left", left);
		
		ormmaview.setTilt(roll, pitch, yaw);
		if (doNotPropogate===true) return;
		compassWidget.updateCompassFromYaw(yaw);
	},
	
	timerUpdateTilt : function() {
		var yaw = parseFloat($("#alphaValue").val()) + tiltWidget.timerAlphaStep,
			pitch = parseFloat($("#betaValue").val()) + tiltWidget.timerBetaStep,
			roll = parseFloat($("#gammaValue").val()) + tiltWidget.timerGammaStep;
			
		if (roll>90) {
			roll = roll-180;
		} else if (roll<-90) {
			roll = roll+180;
		}
		if (pitch>180) {
			pitch = pitch-360;
		} else if (pitch<-180) {
			pitch = pitch+360;
		}
		if (yaw>=360) yaw = yaw - 360;
		if (yaw<0) yaw = yaw + 360;
		
		
		$("#alphaValue").val(yaw);
		$("#betaValue").val(pitch);
		$("#gammaValue").val(roll);
		tiltWidget.updateTiltFromForm();
	},
	
	toggleTiltTiming : function() {
		var state = $("#tiltTiming").attr("class");
		if (state==='t-off') {
			tiltWidget.timer = prompt("Enter number of milliseconds to update tilt", 1000);
			tiltWidget.timerAlphaStep = parseFloat(prompt("Enter number of degrees to change yaw with each update", 1));
			tiltWidget.timerBetaStep = parseFloat(prompt("Enter number of degrees to change pitch with each update", 1));
			tiltWidget.timerGammaStep = parseFloat(prompt("Enter number of degrees to change roll with each update", 1));
			tiltWidget.interval = setInterval(tiltWidget.timerUpdateTilt, tiltWidget.timer);
			$("#tiltTiming").attr("class","t-on");
		} else {
			clearInterval(tiltWidget.interval);
			$("#tiltTiming").attr("class","t-off");
		}
	},
	
	updateYawFromCompass : function(degrees) {
		if (degrees === 0) degrees = 360;
		$("#alphaValue").val(360 - degrees);
		tiltWidget.updateTiltFromForm(true);
	}

};

shakeWidget = {
	timer: null,
	interval: null,
	switchItCounter : 0,
	
	init : function() { 
	},

	shakeIt : function() {
		//alert('shaking');
		//$("#shake-hotspot").css("background-color", "#F00");
		var oEl = document.getElementById("shake-hotspot");
		oEl.style.opacity = 0.5;
		oEl.style.backgroundColor = "#FF6600";
		setTimeout (shakeWidget.switchIt, 200);
		ormmaview.sendShake();
	},
	
	switchIt : function() {
		shakeWidget.switchItCounter++;
		var oEl = document.getElementById("shake-hotspot");
		oEl.style.opacity = (oEl.style.opacity == 0) ? 0.5 : 0.0;	
		if (shakeWidget.switchItCounter < 5) {
			setTimeout (shakeWidget.switchIt, 200);
		} else {
			shakeWidget.switchItCounter = 0;
		}
	},
	
	timerUpdateShake : function() {
		shakeWidget.shakeIt();
	},
	
	toggleShakeTiming : function() {
		var state = $("#shakeTiming").attr("class");
		if (state==='t-off') {
			shakeWidget.timer = prompt("Enter number of milliseconds between shakes", 3000);
			shakeWidget.interval = setInterval(shakeWidget.timerUpdateShake, shakeWidget.timer);
			$("#shakeTiming").attr("class","t-on");
		} else {
			clearInterval(shakeWidget.interval);
			$("#shakeTiming").attr("class","t-off");
		}
	}

}