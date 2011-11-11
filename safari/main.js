/*
 *  Copyright (c) 2011 The ORMMA.org project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree. All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */

//
// Function: load()
// Called by HTML body element's onload event when the web application is ready to start
//
function load() {
    ormmaview.addEventListener('info', function(message) {
        if (document.getElementById('logInfo').checked) {
            var console = document.getElementById('console');
            var now = new Date();
            console.innerHTML = [now.getHours(),':',now.getMinutes(),':',now.getSeconds(),':',now.getMilliseconds(),' INFO ',message,'<br />',console.innerHTML].join('');
        }
    });
    
    ormmaview.addEventListener('error', function(message) {
        if (document.getElementById('logError').checked) {
            var console = document.getElementById('console');
            var now = new Date();
            console.innerHTML = [now.getHours(),':',now.getMinutes(),':',now.getSeconds(),':',now.getMilliseconds(),' <span style="color:red;">ERROR ',message,'</span><br />',console.innerHTML].join('');
        }
    });
}

// SETUP FORM ///////////////////////////////////////////////////////////////

var templates = {};

var features = {
    orientation:{ name:'Screen Orientation' },
    heading:{ name:'Compass Heading' },
    location:{ name:'Device Location' },
    shake:{ name:'Shake' },
    tilt:{ name:'Tilt' },
    network:{ name:'Network Status' },
    sms:{ name:'SMS' },
    phone:{ name:'Phone' },
    email:{ name:'Email' },
    calendar:{ name:'Calendar' },
    camera:{ name:'Camera' },
	map:{ name:'Map' },
	audio: {name:'Audio'},
	video: {name:'Video'}
};

function contains(array, item) {
    for (var i in array) {
        if (array[i] == item) return true;
    }
    return false;
};

function applyTemplate(template) {
    var form = document.forms.setup;
    form.screenWidth.value = templates[template].screenWidth;
    form.screenHeight.value = templates[template].screenHeight;
    for (var feature in features) form[feature].checked = !contains(templates[template].nosupport, feature);
};

function swapOrientation() {
    var form = document.forms.setup;
    var tmp = form.screenWidth.value;
    form.screenWidth.value = form.screenHeight.value;
    form.screenHeight.value = tmp;
};

function toggleLevel2(enabled) {
    var form = document.forms.setup;
    form.orientation.disabled = !enabled;
    form.heading.disabled = !enabled;
    form.location.disabled = !enabled;
    form.shake.disabled = !enabled;
    form.tilt.disabled = !enabled;
    form.network.disabled = !enabled;
    form.sms.disabled = !enabled;
    form.phone.disabled = !enabled;
    form.email.disabled = !enabled;
    form.calendar.disabled = !enabled;
    form.camera.disabled = !enabled;
    form.map.disabled = !enabled;
    form.audio.disabled = !enabled;
    form.video.disabled = !enabled;
};

function renderAd() {

	var form = document.forms.setup;
    prepareOrmmaView(form)
    ormmaview.setAdURI(form.adURI.value, form.fragment.checked);
	ormmaview.setUseHtml(false);
    ormmaview.render();
	$('#tabs').tabs().tabs('select', 2); // switch to third tab
};

function renderHtmlAd() {

	var form = document.forms.setup;
    prepareOrmmaView(form);
	ormmaview.setUseHtml(true, form.adFragment.value);
	ormmaview.render();
	$('#tabs').tabs().tabs('select', 2); // switch to third tab
}

function prepareOrmmaView(form) {
/* 
no refresh form anymore
    document.forms.refresh.adURI.value = document.forms.setup.adURI.value;
    document.forms.refresh.fragment.checked = document.forms.setup.fragment.checked;

Note: This must be served from a webserver when using Chrome, otherwise you'll
      run into cross-domain limitations. For more information see:
      http://74.125.153.99/support/forum/p/Chrome/thread?tid=0ba628caf22b4a31&hl=en
*/    
    ormmaview.setScreenSize(parseInt(form.screenWidth.value, 10), parseInt(form.screenHeight.value, 10));
    ormmaview.setDefaultPosition(parseInt(form.adLeft.value, 10), parseInt(form.adTop.value, 10), parseInt(form.adWidth.value, 10), parseInt(form.adHeight.value, 10));
    ormmaview.setMaxAdSize((form.adMaxWidth.value)?parseInt(form.adMaxWidth.value, 10):parseInt(form.screenWidth.value, 10), (form.adMaxHeight.value)?parseInt(form.adMaxHeight.value, 10):parseInt(form.screenHeight.value, 10));
    ormmaview.setSupports(ormmaview.FEATURES.LEVEL1, form.level1.checked);
    ormmaview.setSupports(ormmaview.FEATURES.LEVEL2, form.level2.checked);
    for (var feature in features) {
        if ((typeof feature) == 'string') {
            ormmaview.setSupports(feature, form.level2.checked && form[feature].checked);
        }
    }
    if (form.template.value != '') ormmaview.setTemplate(templates[form.template.value].name);
}

// AD VIEW ///////////////////////////////////////////////////////////////

function refreshAd(form) {
    ormmaview.setAdURI(form.adURI.value, form.fragment.checked);
    ormmaview.render();
};

function reorient(form) {
    var tmp = form.screenWidth.value;
    form.screenWidth.value = form.screenHeight.value;
    form.screenHeight.value = tmp;
    
    ormmaview.reorient();
};

// CAPABILITIES TOGGLES ///////////////////////////////////////////////////

function toggleWidgetVisibility (ele) {
	var formValue = ele.checked,
		formEnabled = !ele.disabled,
	    divName = ele.name+'Div';
	if (formValue && formEnabled) {
		$("#"+divName).show();
	} else {
		$("#"+divName).hide();
	}
}

function toggleWidgetVisibilityAll() {
	for (var feature in features) {
		toggleWidgetVisibility ($("#"+feature)[0]);
    }
}