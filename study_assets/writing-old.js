
var id; // global container for "id" url parameter
jatos.onLoad(function() {
    jatos.addAbortButton();
    id = jatos.urlQueryParameters['id'];
    initialize_perspectives();
    initialize_narrative_container();
});

// Global variables for tracking which perspective we're on
var perspectives = [];
var perspective_idx = 0;
var curr_perspective;

// Global container for current narratives. Will be kept in sync with batch session data
var narratives = [];

// Global data container
var data_rows = [];

function control_flow(ctrl) {
	console.log(ctrl);
	if (ctrl == 'narrative container initialized') {
		create_content_div();
		update_batch_data_then('collect narrative');
	} else if (ctrl == 'collect narrative') {
		// First update the batch data, then show input area
		clear_content_div();
		get_narrative();
	} else if (ctrl == 'done current narrative') {
		store_narrative();
		perspective_idx++;
		control_flow('perspective-idx-updated');
	} else if (ctrl == 'perspective-idx-updated') {
		if (perspective_idx < perspectives.length) {
			update_batch_data_then('collect narrative');
		} else {
			confirm_all_narratives_screen();
		}
	} else if (ctrl == 'back button') {
		store_narrative();
		perspective_idx--;
		control_flow('perspective-idx-updated');
	} else if (ctrl == 'confirmed all narratives') {
		clear_content_div();
		update_batch_data_then('last batch data update');
	} else if (ctrl == 'last batch data update') {
		save_narratives();
	} else if (ctrl == 'narratives saved') {
		end_screen();
		// Should the participant move on to the rating stage or not?
	}
}

function initialize_perspectives() {
	// Create a numerical label for each perspective along with its name
	var i;
	for (i = 0; i < jatos.studyJsonInput.perspectives.length; i++) {
		perspectives.push({
			'id': i,
			'name': jatos.studyJsonInput.perspectives[i]
		})
	}
	/*
	// Shuffle
	var tmp = [];
	var idx;
	while (perspectives.length > 0) {
		idx = Math.floor(Math.random() * perspectives.length);
		var spliced = perspectives.splice(idx, 1)[0];
		tmp.push(spliced);
	}
	perspectives = tmp;
	*/
}

function initialize_narrative_container() {
	// Get batch session data for this participant
	var ptpt_data = JSON.parse(jatos.batchSession.get(id));
	if (ptpt_data) {
		// If previous narratives exist, use them
		ptpt_data['narratives'];
	} else {
		// Otherwise initialize them anew
		narratives = [];
		var i;
		for (i = 0; i < perspectives.length; i++) {
			narratives[i] = {
				// writer: jatos.workerId,
				writer: id,
				trial_n: perspective_idx,
				perspective_id: perspectives[i]['id'],
				perspective_name: perspectives[i]['name'],
				narrative: ''
			}
		}
	}
	control_flow('narrative container initialized');
}

function create_content_div() {
	var content_div = document.createElement('div');
	content_div.id = 'content-div';
	content_div.style.textAlign = 'center';
	content_div.style.position = 'relative';
	content_div.style.marginTop = '100px';
	content_div.style.marginTop = '100px';
	document.body.appendChild(content_div);
	clear_content_div();
}

function clear_content_div() {
	var content_div = document.getElementById('content-div');
	content_div.innerHTML = '';
}

function para(txt) {
	var p = document.createElement('p');
	p.setAttribute('class', 'text');
	p.innerText = txt;
	p.style.wordBreak = 'break-word';
	return(p);
}

function button(type) {
	var btn = document.createElement('button');
	if (type == 'done current narrative') {
		btn.innerText = 'Done';
		btn.onclick = function() {control_flow('done current narrative')};
	} else if (type == 'back') {
		btn.innerText = 'Back';
		btn.onclick = function() {control_flow('back button')};
	} else if (type == 'confirmed all narratives') {
		btn.innerText = 'Done';
		btn.onclick = function() {control_flow('confirmed all narratives')};
	} else if (type == 'submit ratings') {
		btn.innerText = 'Done';
		btn.onclick = function() {control_flow('rating submitted')};
	} else if (type == 'ratings') {
		btn.innerText = 'Begin ratings';
		btn.onclick = function() {jatos.startComponentByTitle('rating')};
	}
	return(btn);
}

// Create input area
function get_narrative() {
	curr_perspective = perspectives[perspective_idx];
	var content_div = document.getElementById('content-div');
	// Create instructions;
	content_div.appendChild(para('Write from the perspective of ' + curr_perspective['name']));
	// Create textinput
	var input = document.createElement('textarea');
	input.id = 'narrative';
	input.rows = 5;
	input.cols = 50;
	content_div.appendChild(input);
	// Prefill if applicable
	input.value = JSON.parse(jatos.batchSession.find('/' + id))['narratives'][perspective_idx]['narrative'];
	// Back/forward buttons
	content_div.appendChild(document.createElement('br'));
	if (perspective_idx > 0) {
		content_div.appendChild(button('back'));
	}
	content_div.appendChild(button('done current narrative'));
}

function store_narrative() {
	var input = document.getElementById('narrative');
	narratives[perspective_idx].narrative = input.value;
}


function update_batch_data_then(next_ctrl) {
	// Make sure it's synced up
	var ptpt_data = {narratives: narratives, perspective_idx: perspective_idx};
	update_batch_data(id, ptpt_data, function() {control_flow(next_ctrl)});
}

function save_narratives() {
	jatos.appendResultData(data_rows,
		function() {control_flow('narratives saved')}, // on success
		function() {save_narratives} // on fail
	);
}

function confirm_all_narratives_screen() {
	clear_content_div();
	var content_div = document.getElementById('content-div');
	content_div.appendChild(para('Are you done writing?'));
	content_div.appendChild(button('back'));
	content_div.appendChild(button('confirmed all narratives'));
}

function end_screen() {
	var content_div = document.getElementById('content-div');
	content_div.appendChild(para('Done! Waiting for next phase to start.'));
	jatos.onBatchSession(possible_next_phase);
}

function possible_next_phase() {
	var expt_phase = get_expt_phase();
	if (expt_phase != 'writing') {
		jatos.startComponentByTitle(expt_phase);
	}
}
