
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
		parsed.push({
			'writer': trial['id'],
			'perspective': trial['perspective'],
			'txt': trial.response['Q0']
		})
	}
	return parsed;
}
