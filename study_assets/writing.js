
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
    // Get perspectives
    var perspectives = get_input_param('perspectives');
    var writing_task = create_writing_task(perspectives);
    jsPsych.run(writing_task);
});

function create_writing_task(perspectives) {
	// create nested timeline (see https://www.jspsych.org/v7/overview/timeline/#nested-timelines)
	var timeline = [];
	var i;
	for (i = 0; i < perspectives.length; i++) {
		// Pre-writing question(s)
		var pre_writing_timeline_input = get_input_param('pre_writing_timeline');
		console.log(pre_writing_timeline_input)
		if (pre_writing_timeline_input) {
			var pre_writing_timeline = jatos_input_to_jspsych_trials(
				pre_writing_timeline_input,
				{'%PERS%': perspectives[i]}
			);
			timeline = timeline.concat(pre_writing_timeline);
		}
		// Actual writing task
		var writing_trial = {
	    type: jsPsychSurveyText,
			questions: [{
				prompt: get_input_param('writing_prompt').replace('%PERS%', perspectives[i]),
				rows: get_input_param('n_lines') || 5
			}],
			data: {perspective: perspectives[i]},
			on_start: send_update_from_ptpt,
	    on_finish: send_update_from_ptpt,
	    on_load: function() { // implement word limit
	    	var max_words = get_input_param('max_words');
	    	var display_wordcount = get_input_param('display_wordcount') || false;
	    	if (max_words) {
	    		var input_area = document.getElementById('input-0');
	    		if (display_wordcount) {
	    			// Add running word count display
		    		input_area.insertAdjacentHTML('afterend', '<p>(<span id="word_count">0</span>/%s words)</p>'.replace('%s', max_words));
	    		}
	    		// Initialize variables used to track wordcount
	    		var prev_text = input_area.value;
	    		var max_words_reached = false;
	    		// Add function to count words
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
			    				word_count = max_words;
			    				break;
			    			} else {
			    				last_char = 'letter';
			    			}
		    			}
		    		}
		    		prev_text = input_area.value;
		    		if (display_wordcount) {
		    			var word_count_span = document.getElementById('word_count');
			    		word_count_span.innerText = word_count;
		    		}
		    	});
	    	}
	    }
		}
		timeline.push(writing_trial);
		// Post-writing question(s)
		var post_writing_timeline_input = get_input_param('post_writing_timeline');
		console.log(post_writing_timeline_input)
		if (post_writing_timeline_input) {
			var post_writing_timeline = jatos_input_to_jspsych_trials(
				post_writing_timeline_input,
				{'%PERS%': perspectives[i]}
			);
			timeline = timeline.concat(post_writing_timeline);
		}
	}
	return timeline;
}

function final_screen() {
	send_update_from_ptpt();
	var div = jsPsych.getDisplayElement();
	div.innerHTML = get_input_param('post_writing_message') || "Writing phase finished! Please keep this window open.";
	jatos.onBatchSession(possible_next_phase);
}

function possible_next_phase() {
	var expt_phase = get_expt_phase();
	if (expt_phase != 'writing') { // current phase
		jatos.startComponentByTitle(expt_phase);
	}
}