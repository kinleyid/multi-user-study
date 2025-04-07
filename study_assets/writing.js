
var id; // global container for "id" url parameter

var jsPsych = initJsPsych({
  on_finish: function() {
  	// upload results and go to final screen
  	upload_results_retry(jsPsych.data.get().csv(), final_screen);
  }
});

jatos.onLoad(function() {
    id = jatos.urlQueryParameters['id'];
    jsPsych.data.addProperties({id: id, expt_phase: get_expt_phase()});
    var perspectives = jatos.studyJsonInput['perspectives'];
    var writing_task = create_writing_task(perspectives);
    jsPsych.run([writing_task]);
});

function create_writing_task(perspectives) {
	// create nested timeline (see https://www.jspsych.org/v7/overview/timeline/#nested-timelines)
	var timeline = [];
	var i;
	for (i = 0; i < perspectives.length; i++) {
		timeline.push(
			{
				'questions': [{prompt: 'Perspective: ' + perspectives[i]}],
				'data': {perspective: perspectives[i]}
			}
		);
	}
	// create trial object
	var question_trials = {
    type: jsPsychSurveyText,
    timeline: timeline, // nested timeline
    on_start: send_update_from_ptpt,
    on_finish: send_update_from_ptpt
	}
	return question_trials;
}

function final_screen() {
	send_update_from_ptpt();
	var div = jsPsych.getDisplayElement();
	div.innerHTML = 'Done! Waiting for next phase to start';
	jatos.onBatchSession(possible_next_phase);
}

function possible_next_phase() {
	var expt_phase = get_expt_phase();
	if (expt_phase != 'writing') { // current phase
		jatos.startComponentByTitle(expt_phase);
	}
}