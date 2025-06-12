
var id; // global container for "id" url parameter

var jsPsych = initJsPsych({
  on_finish: function() {
  	// upload results and go to final screen
  	upload_results_retry(jsPsych.data.get().csv(), final_screen);
  }
});

jatos.onLoad(function() {
    id = jatos.urlQueryParameters['id'];
    jsPsych.data.addProperties({batch: jatos.batchProperties.title, id: id, expt_phase: get_expt_phase()});
    var narratives = get_narratives();
    var rating_task = create_rating_task(narratives);
    jsPsych.run(rating_task);
});

function get_narratives() {
	var admin_data = get_batch_data('admin');
	var all_narratives = admin_data['narratives'];
	// Filter to remove own narratives
	var others_narratives = [];
	var i, cand_narr;
	for (i = 0; i < all_narratives.length; i++) {
		cand_narr = all_narratives[i];
		if (cand_narr['writer'] != id) {
			others_narratives.push(cand_narr);
		}
	}
	// Shuffle
	others_narratives = jsPsych.randomization.shuffle(others_narratives);
	return others_narratives;
}

function create_rating_task(narratives) {
	var timeline = [];
	var ni; // narrative idx
	for (ni = 0; ni < narratives.length; ni++) {
		// get default survey_json
		// by default, use studyJsonInput
		var ratings_json = jatos.studyJsonInput['ratings'];
		if (jatos.batchJsonInput['ratings']) {
			ratings_json = jatos.batchJsonInput['ratings'];
		}
		var ratings = JSON.parse(JSON.stringify(ratings_json)); // deep copy
		var ri; // rating idx
		for (ri = 0; ri < ratings.length; ri++) {
			// determine default params
			var default_params;
			if (ratings[ri]['type'] == 'vas') {
				trial_type = jsPsychHtmlVasResponse;
				default_params = {
					'type': jsPsychHtmlVasResponse,
					'stimulus': '[placeholder preamble]',
					'prompt': '[placeholder prompt]<br>',
					'labels': ['[placeholder label]', '[placeholder label]'],
					'scale_width': 500
				}
			} else if (ratings[ri]['type'] == 'likert') {
				default_params = {
					'type': jsPsychSurveyLikert,
					'preamble': '[placeholder preamble]',
					'scale_width': 500,
					'questions': [
						{
							'prompt': '[placeholer prompt]',
							'labels': ['[placeholder label]', '[placeholder label]'],
						}
					]
				}
			} else if (ratings[ri]['type'] == 'text') {
				default_params = {
					'type': jsPsychSurveyText,
					'preamble': preamble_template,
					'questions': [
						{
							'prompt': '[placeholer prompt]'
						}
					]
				}
			}
			// get user-defined params
			params = ratings[ri]['params'] || {};
			// insert default params where necessary
			for (dp in default_params) {
				if (params[dp] == undefined) {
					params[dp] = default_params[dp];
				}
			}
			// insert narrative wherever %NARR% occurs
			for (p in params) {
				if (typeof params[p] == 'string') {
					params[p] = params[p].replace('%NARR%', narratives[ni]['txt']);
				}
			}
			// add data field to record perspective being rated
			params['data'] = {
				'writer': narratives[ni]['writer'],
				'perspective_prompt': narratives[ni]['perspective_prompt']
			}
			// add functions to update batch data
			params['on_start'] = send_update_from_ptpt;
			params['on_finish'] = send_update_from_ptpt;
			// append to timeline
			timeline.push(params);
		}
	}
	return timeline;
}

function final_screen() {
	send_update_from_ptpt();
	var div = jsPsych.getDisplayElement();
	div.innerHTML = 'Experiment finished!';
}