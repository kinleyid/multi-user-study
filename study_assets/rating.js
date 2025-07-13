
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
		// get json input
		var rating_timeline_input = get_input_param('rating_timeline');
		// convert to trials
		var rating_timeline = jatos_input_to_jspsych_trials(
			rating_timeline_input,
			// txt replacements:
			{
				"%PERS%": narratives[ni]['perspective'],
				"%NARR%": narratives[ni]['txt']
			},
			// data:
			{
				'writer': narratives[ni]['writer'],
				'perspective': narratives[ni]['perspective']
			}
		);
		/*
		var ratings_json = jatos.studyJsonInput['ratings'];
		if (jatos.batchJsonInput['ratings']) {
			ratings_json = jatos.batchJsonInput['ratings'];
		}
		var ratings = JSON.parse(JSON.stringify(ratings_json)); // deep copy
		var ri; // rating idx
		for (ri = 0; ri < ratings.length; ri++) {
			rating_trial = {}
			rating_trial.type = {
				'vas': jsPsychHtmlVasResponse,
				'likert': jsPsychSurveyLikert,
				'text': jsPsychSurveyText
			}[ratings[ri]['type']];
			// get user-defined params
			params = ratings[ri]['params'];
			// insert default params where necessary
			var p;
			for (p in params) {
				rating_trial[p] = params[p];
			}
			// insert narrative wherever %NARR% occurs
			// insert perspective wherever %PERS% occurs
			for (p in rating_trial) {
				if (typeof rating_trial[p] == 'string') {
					rating_trial[p] = rating_trial[p].replace('%NARR%', narratives[ni]['txt']);
					rating_trial[p] = rating_trial[p].replace('%PERS%', narratives[ni]['perspective']);
				}
			}
			// add data field to record perspective being rated
			rating_trial['data'] = {
				'writer': narratives[ni]['writer'],
				'perspective': narratives[ni]['perspective']
			}
			// add functions to update batch data
			rating_trial['on_start'] = send_update_from_ptpt;
			rating_trial['on_finish'] = send_update_from_ptpt;
			// append to timeline
			timeline.push(rating_trial);
		}
		*/
		timeline = timeline.concat(rating_timeline);
	}
	return timeline;
}

function final_screen() {
	send_update_from_ptpt();
	var div = jsPsych.getDisplayElement();
	div.innerHTML = div.innerHTML = get_input_param('post_rating_message') || "Experiment finished!"
}