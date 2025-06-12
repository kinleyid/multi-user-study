
var id; // global container for "id" url parameter

var jsPsych = initJsPsych({
  on_finish: function() {
  	// upload results and go to final screen
  	upload_results_retry(jsPsych.data.get().csv(), final_screen);
  }
});

jatos.onLoad(function() {
    id = jatos.urlQueryParameters['id'];
    // Record all URL parameters.
    jsPsych.data.addProperties({batch: jatos.batchProperties.title, id: id, expt_phase: get_expt_phase()});
    // Get perspective_prompts---default to study-wise, overwrite with batch-wise
    var perspective_prompts = jatos.studyJsonInput['perspective_prompts'];
    if (jatos.batchJsonInput['perspective_prompts']) {
    	perspective_prompts = jatos.batchJsonInput['perspective_prompts'];
    }
    var writing_task = create_writing_task(perspective_prompts);
    jsPsych.run(writing_task);
});

function create_writing_task(perspective_prompts) {
	// create nested timeline (see https://www.jspsych.org/v7/overview/timeline/#nested-timelines)
	var timeline = [];
	var i;
	for (i = 0; i < perspective_prompts.length; i++) {
		// create trial object
		var writing_trial = {
	    type: jsPsychSurveyText,
			questions: [{
				prompt: perspective_prompts[i],
				rows: jatos.studyJsonInput['n_lines'] || jatos.batchJsonInput['n_lines'] || 5
			}],
			data: {perspective_prompt: perspective_prompts[i]},
			on_start: send_update_from_ptpt,
	    on_finish: send_update_from_ptpt,
	    on_load: function() { // implement word limit
	    	var max_words = jatos.studyJsonInput['max_words']
	    	if (jatos.batchJsonInput['max_words']) {
	    		max_words = jatos.batchJsonInput['max_words'];
	    	}
	    	if (max_words) {
	    		var input_area = document.getElementById('input-0');
	    		var prev_text = input_area.value;
	    		var max_words_reached = false;
		    	input_area.addEventListener('input', function(e) {
		    		var cand_text = input_area.value; // What writing is as of user's current input
		    		// Loop over characters
		    		var word_count = 0;
		    		var last_char = 'nonletter';
		    		var i, curr_char;
		    		for (i = 0; i < cand_text.length; i++) {
		    			curr_char = cand_text[i];
		    			if (curr_char.trim() == '') {
		    				// Non-letter
		    				last_char = 'nonletter';
		    			} else {
		    				// Letter---writing current word
		    				if (last_char == 'nonletter') {
		    					word_count += 1;
		    				}
		    				if (word_count > max_words) {
			    				alert('Max. words: ' + max_words);
			    				e.target.value = prev_text;
			    				break;
			    			} else {
			    				last_char = 'letter';
			    			}
		    			}
		    		}
		    		prev_text = input_area.value;
		    	});
	    	}
	    }
		}
		// Create rating---default to studyJsonInput but overwrite if applicable with batchJsonInput
		var post_writing_question = jatos.studyJsonInput['post_writing_question'];
		if (jatos.batchJsonInput['post_writing_question']) {
			post_writing_question = jatos.batchJsonInput['post_writing_question'];
		}
		var rating_trial = {};
		// Set type
		rating_trial.type = {
			'vas': jsPsychHtmlVasResponse,
			'likert': jsPsychSurveyLikert
		}[post_writing_question.type];
		// Use user-defined params
		var k;
		for (k in post_writing_question.params) {
			rating_trial[k] = post_writing_question.params[k];
		}
		/*
		var rating = {
			type: jsPsychSurveyLikert,
			preamble: 'My text accurately reflects the position of a person who holds this perspective',
			scale_width: 500,
			questions: [
				{
					labels: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree']
				}
			]
		}
		*/
		timeline.push(writing_trial, rating_trial);
	}
	return timeline;
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