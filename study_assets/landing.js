
function update() {
	var info = document.getElementById('info');
	var expt_phase = get_expt_phase();
	if (expt_phase == 'none') {
		info.innerText = 'Waiting for admin to arrive.';
	} else {
		if (expt_phase == 'pre') {
			info.innerText = 'Waiting for first phase to start.';
			schedule_another_update = true;
		} else {
			jatos.startComponentByTitle(expt_phase);
		}
	}
	
}

jatos.onLoad(function() {
    var id = jatos.urlQueryParameters['id'];
    if (id) {
	    if (id == 'admin') {
	    	jatos.startComponentByTitle('admin');
	    } else {
	    	// initialize this participant's partition of the batch session data
	    	update_batch_data_retry(
	    		'/' + id,
	    		{
		    		'perspective': null, // For storing which perspective this participant agrees with
		    		'scratch': null // For storing all other info temporarily
		    	},
		    	false); // don't stringify
	    	// await update
	    	jatos.onBatchSession(update);
	    }
    } else {
    	// No ID
		var info = document.getElementById('info');
		info.innerText = 'No ID URL parameter! Make sure to add "id=<id>" to the end of the link.'
    }
});
