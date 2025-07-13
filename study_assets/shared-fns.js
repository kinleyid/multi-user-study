
function update_batch_data_retry(field, data, next_fn) {
	var json = JSON.stringify(data);
	console.log('Updating ' + field + ' with ' + json);
	// Simple wrapper to try again if data update fails
	jatos.batchSession.set(field, json,
		next_fn, // on success
		function(e) { // on fail, try again
			setTimeout(
				function() {update_batch_data_retry(field, data, next_fn)},
				500); // after a short delay
		}
	);
}

function get_batch_data(field) {
	// simple wrapper, avoids call to JSON every time
	var json = jatos.batchSession.get(field);
	var data = JSON.parse(json);
	return data;
}

function get_expt_phase() {
	var expt_phase;
	var admin_json = jatos.batchSession.get('admin');
	if (admin_json) {
		var admin_data = JSON.parse(admin_json);
		expt_phase = admin_data['expt_phase'];
	} else {
		expt_phase = 'none';
	}
	return expt_phase;
}

function send_update_from_ptpt() {
	var to_send = {
		data: jsPsych.data.get(),
		progress: jsPsych.getProgress()
	}
	update_batch_data_retry(id, to_send);
}

function upload_results_retry(data, next_fn) {
	// simple wrapper with retry
	jatos.submitResultData(data, next_fn, function() {upload_results_retry(data, next_fn)});
}

function parse_narrative_data(data) {
	// go from jsPsych's data format (extensive, complex) to a simpler format
	var parsed = [];
	var trials = data['data']['trials'];
	var i, trial;
	for (i = 0; i < trials.length; i++) {
		trial = trials[i];
		if (trial['trial_type'] == 'survey-text') { // Identify actual writing trials vs ratings
			parsed.push({
				'writer': trial['id'],
				'perspective': trial['perspective'],
				'txt': trial.response['Q0']
			});
		}
	}
	return parsed;
}

function get_input_param(param_name) {
	// Get a parameter from either studyJsonInput or batchJsonInput
	// Piority given to batchJsonInput
	var out = jatos.studyJsonInput[param_name];
	if (jatos.batchJsonInput[param_name]) {
		out = jatos.batchJsonInput[param_name];
	}
	return out;
}

function jatos_input_to_jspsych_trials(input, txt_replacements, data) {
	// Convert JATOS's JSON input to an array of jsPsych trial objects
	// Input is parsed JSON (can be array or single object)
	// txt_replacements is an object mapping special codes (e.g. "%NARR%") to replacements (e.g. the current narrative to rate)
	// data is an object to add as data
	// var input = JSON.parse(JSON.stringify(json)); // deep copy
	
	// Make input an array
	if (!Array.isArray(input)) {
		input = [input];
	}
	// Initialize output
	var timeline = [];
	// Loop over input
	var ti; // trial idx
	for (ti = 0; ti < input.length; ti++) {
		curr_trial = {}
		curr_trial.type = {
			'vas': jsPsychHtmlVasResponse,
			'slider': jsPsychHtmlSliderResponse,
			'likert': jsPsychSurveyLikert,
			'text': jsPsychSurveyText
		}[input[ti]['type']];
		// get user-defined params
		params = input[ti]['params'];
		// insert default params where necessary
		var p; // param
		for (p in params) {
			curr_trial[p] = params[p];
		}
		// insert text replacements where necessary
		var txt_code; // special code (e.g., "%NARR%" that will be replaced)
		for (p in curr_trial) {
			if (typeof curr_trial[p] == 'string') {
				for (txt_code in txt_replacements) {
					curr_trial[p] = curr_trial[p].replace(txt_code, txt_replacements[txt_code]);
				}
			}
		}
		// add data
		if (data) {
			curr_trial['data'] = data;
		}
		// add functions to update batch data
		curr_trial['on_start'] = send_update_from_ptpt;
		curr_trial['on_finish'] = send_update_from_ptpt;
		// append to timeline
		timeline.push(curr_trial);
	}
	return timeline;
}