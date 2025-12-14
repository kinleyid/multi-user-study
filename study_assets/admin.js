
jatos.onLoad(function() {
    // create callback for when shared data is updated
    jatos.onBatchSession(update_admin_screen);
    // initialize "admin" field of shared data
    var admin_json = jatos.batchSession.get('admin');
    if (admin_json == undefined) {
        // admin is logging on for first time
        set_expt_phase('pre');
    } else {
        // admin reloaded page
        update_admin_screen();
    }
});

function set_button_availability() {
    // Get buttons and disable them by default
    var buttons = {
        'writing': null,
        'rating': null,
    }
    var k;
    for (k in buttons) {
        buttons[k] = document.getElementById('begin-' + k + '-button');
        buttons[k].disabled = true;
    }

    // Set their availability
    var available_by_phase = {
        'pre': 'writing',
        'writing': 'rating'
    }
    var expt_phase = get_expt_phase();
    for (phase in available_by_phase) {
        if (expt_phase == phase) {
            buttons[available_by_phase[phase]].disabled = false;
        }
    }
}

function set_expt_phase(expt_phase) {
    
    // set expt_phase variable, which is shared across the batch
    var shared_data = jatos.batchSession.getAll();
    var admin_data = shared_data['admin'] || {}; // admin may be logging on for first time
    admin_data['expt_phase'] = expt_phase;
    
    // gather data into one big JSON structure
    if (expt_phase == 'rating') {
        // we are switching from writing phase to rating phase
        // therefore gather narratives and put them in admin/narratives
        var all_narratives = [];
        var id;
        for (id in shared_data) {
            if (id != 'admin') {
                // Get "scratch" field, which contains jsPsych's data array
                ptpt_data = JSON.parse(shared_data[id]['scratch']);
                var narratives = parse_narrative_data(ptpt_data);
                all_narratives = all_narratives.concat(narratives);
            }
        }
        admin_data['narratives'] = all_narratives;
    }

    update_batch_data_retry('/admin', admin_data);
}

function fill_info() {
    var admin_info = document.getElementById('admin-info');
    var expt_phase = get_expt_phase();
    if (expt_phase == 'pre') {
        admin_info.innerText = 'The experiment is in a pre- phase. Participants will be unable to begin the study until you click "Begin writing". As participants open the link, their info will be displayed in the table below.';
    } else if (expt_phase == 'writing') {
        admin_info.innerText = 'The writing phase has begun. Info about the progress will appear below. Click "Begin ratings" to begin the rating phase.';
    } else if (expt_phase == 'rating') {
        admin_info.innerText = 'The ratings phase has begun. Participants can no longer edit their writing.';
    }
}

function update_table() {
    // Clear table
    var tbody = document.getElementById('info-table-body');
    tbody.innerHTML = '';
    // Display will depend on phase of experiment
    var expt_phase = get_expt_phase();
    // Update table
    var data = jatos.batchSession.getAll();
    var id, row, ptpt_data;
    for (id in data) {
        if (id != 'admin') {
            // Get data for current participant (null by default)
            ptpt_data = JSON.parse(data[id]['scratch']);
            var row = tbody.insertRow();
            // Show participant
            row.insertCell(0).textContent = id;
            // Show writing progress
            row.insertCell(1).textContent = get_progress_txt('writing', ptpt_data);
            // Show rating progress
            row.insertCell(2).textContent = get_progress_txt('rating', ptpt_data);
        }
    }
}

function get_progress_txt(phase, data) {
    var progress_txt;
    if (get_expt_phase() == phase) {
        if (data == null) {
            progress_txt = '[no data]';
        } else {
            // progress_txt = Math.round(data.progress.percent_complete) + '%';
            progress_txt = 'trial ' + data.progress.current_trial_global + '; ' + (data.progress.percent_complete == 100 ? 'done!' : ' ');
        }        
    } else {
        progress_txt = 'N/A';
    }
    return progress_txt;
}

function update_admin_screen() {
    set_button_availability();
    fill_info();
    update_table();
}

function obj_array_to_csv(obj_array) {
    var csv = '';
    var colnames = [];
    for (k in obj_array[0]) {
        colnames.push(k);
    }
    csv += colnames.toString() + '\n';
    var ri, ci, col, row;
    for (ri = 0; ri < obj_array.length; ri++) {
        row = [];
        for (ci = 0; ci < colnames.length; ci++) {
            col = colnames[ci];
            row.push(obj_array[ri][col]);
        }
        csv += row.toString() + '\n'
    }
}