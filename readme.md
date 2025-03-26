
## Workflow to run a new experiment

Create a new batch, and enable only the "general multiple" link type under the "properties" for that batch. This allows you to distribute a single link that you can individualize via URL parameters.

Get a link for that batch. Using an "id" URL parameter will allow you to individualize the link. The id "admin" brings you to the admin screen (so make sure not to give a link with "?id=admin" to any participant!)

## Starting the experiment

Distribute the links to participants. If they open them before you've opened the "admin" link, they will just see a "waiting for admin" screen. As they join, you will see the table begin to be populated.

## Writing phase

First, click "begin writing" to start the writing phase. Now the "writing progress" column will show which of the narratives participants are currently writing (remember that they can go back). When they confirm all their narratives, their "writing progress" will be "Done".

## Rating phase

When the writing is complete, click "begin ratings" to begin the rating phase. 

Generate a new link. This link will be given to all participants, with individual participants separated by an "id" URL parameter

# Technical details

Jatos has a single global "batch data" object that can be shared across all users within the same batch.

It's segregated by user---i.e., each time a new "id" logs on, they get a new field to read/write from in the shared data. This avoids conflict when trying to write to the same field simultaneously.

Any hierarchical data is stored as a JSON string and parsed as needed.

The "admin" field is used for things like setting the phase of the experiment and storing narratives/data in a tabular format.

admin/ (field added when admin joins)
	expt_phase/ (string used to specify the current phase of the experiment)
		Can be "pre", "writing", or "ratings"
	narrative_data/ (field added when writing phase ENDS; a JSON string containing a table with fields):
		writer, trial_n, perspective_id, perspective_name, narrative
	rating_data/ ():

\<id\>/ (field added when a participant joins)
	The point of having the batch data object segregated by participant ID like this is to avoid conflicts when multiple participants try to update the shared data simultaneously.
	At first, the contents will be that participant's narratives (as a JSON string)
	This can then be cleared in between the writing and rating phases


This experiment structures it as follows: first, there is a "narratives"