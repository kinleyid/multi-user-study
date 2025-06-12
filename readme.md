
# Multi-user narrative study

## Setting up a new experiment

### Creating a new batch

JATOS uses "batches" to enable data to be shared between participants completing the same experiment simultaneously. To run a new experiment, create a new batch by clicking "Study Links" on the home screen of the study and then "New Batch". Give the new batch an informative title. Enable only the "General Multiple" link type under the "Properties" for that batch. This allows you to distribute a single link that you can individualize via URL parameters.

### Getting the link to the study

Click "Get Study Links" and, in the drop-down menu next to "Choose batch", select the batch you just created. Next to "Choose type", select "General Multiple" and then click "Continue". The link you see on the next screen is the link that everyone (including you) will use to access the experiment. However, JATOS still needs to be able to distinguish between different people using the same link. To do this, we will add a *URL parameter* called "id".

### Customizing the link for different participants

To create a different link for each user of the study, add `id=<id>` to the end of the link from the previous step. `id=admin` brings you to the admin page. For example, suppose the link from the previous step was `https://jatos.mindprobe.eu/publix/a1b2c3d4e5`. Your admin link to access the study would then be `https://jatos.mindprobe.eu/publix/a1b2c3d4e5?id=admin`. Similarly, if you had participants `P001`, `P002`, and `P003`, their links to access the study would be:

1. `https://jatos.mindprobe.eu/publix/a1b2c3d4e5?id=P001`
2. `https://jatos.mindprobe.eu/publix/a1b2c3d4e5?id=P002`
3. `https://jatos.mindprobe.eu/publix/a1b2c3d4e5?id=P003`

Note that you can use this ID parameter to encode other information---for example, if participants will complete the study twice, you could give `P001` the following two links:

1. `https://jatos.mindprobe.eu/publix/a1b2c3d4e5?id=P001_1`
2. `https://jatos.mindprobe.eu/publix/a1b2c3d4e5?id=P001_2`

### Customizing the experiment

To customize aspects of the experiment such as the questions that will be displayed, the rating scales, etc., you can customize the "input" to the study (which will affect all batches) or the "input" to a single batch (which will affect only that batch). The "input" to the study can be found by:

1. Navigating to the homepage of the study
2. Clicking "Properties"
3. Scrolling down to "Study input"

The "input" to a single batch can be found by:

1. Navigating to the homepage of the study
2. Clicking "Study Links" to see a list of batches
3. Clicking on "Properties" for the batch you want to customize
4. Scrolling down to "Batch input"

**Note: do not edit the "Batch Session Data". This is where data shared between participants in the same batch is stored. It should not be edited by hand. JATOS also has a warning to this effect.**

The "study input" and "batch input" are both fields where you can enter JSON text. The general format of JSON data is as follows:

```
{
	"<name_of_text_param>": "<value_of_text_param>",
	"<name_of_numeric_param>": 999,
	"<name_of_array_of_params>": ["<value_1>", "<value_2>", "<value_3>"],
	"<name_of_nested_structure>": {
		"<name_of_text_param>": "<value_of_text_param>",
		"<name_of_array_of_params>": ["<value_1>", "<value_2>", "<value_3>"]
	}
}
```

There is more extensive documentation of JSON online.

Whether you are editing the "study input" or "batch input", you can use the same parameters to customize the experiment:

- `perspective_prompts`: An array of text values containing the prompts each participant will be see to write their narratives.
- `n_lines`: The number of lines participants see while they are writing their narratives.
- `max_words`: The maximum number of words allowed in participant narratives.
- `post_writing_question`: A single question asked after the writing of each narrative (see examples below).
- `ratings`: A set of questions asked to participants about the narratives of others.

For example, the study input might be the following:

```
{
  "perspective_prompts": [
    "How would a consequentialist respond to the trolley problem?",
    "How would a deontologist respond to the trolley problem?"
  ],
  "n_lines": 5,
  "max_words": 300,
  "post_writing_question": {
    "type": "likert",
    "params": {
      "preamble": "My text accurately reflects the position of a person who holds this perspective",
      "scale_width": 500,
      "questions": [
        {
          "prompt": "Do you agree?",
          "labels": [
            "Strongly disagree",
            "Disagree",
            "Neutral",
            "Agree",
            "Strongly agree"
          ]
        }
      ]
    }
  },
  "ratings": [
    {
      "type": "vas",
      "params": {
        "preamble": "Consider the following narrative:<br><br><span style=\"border: 1px solid black; padding: 5px\">%NARR%</span><br><br>Do you agree with this?",
        "scale_width": 500,
        "labels": [
          "Not at all",
          "Neutral",
          "Completely"
        ]
      }
    },
    {
      "type": "likert",
      "params": {
        "preamble": "Consider the following narrative:<br><br><span style=\"border: 1px solid black; padding: 5px\">%NARR%</span><br><br>",
        "questions": [
          {
            "prompt": "Do you agree with this?",
            "labels": [
              "Not at all",
              "Mostly not",
              "Neutral",
              "Somewhat",
              "Completely"
            ]
          },
          {
            "prompt": "Do you think this was written by someone who genuinely believes it?",
            "labels": [
              "No",
              "Yes"
            ]
          }
        ]
      }
    },
    {
      "type": "text",
      "params": {
        "questions": [
          {
            "prompt": "Please provide any further thoughts here",
            "rows": 3
          }
        ]
      }
    }
  ]
}
```
You can set the "batch input" to the above and experiment with it to get a sense of how it works.

## Starting the experiment

Distribute the links to participants. If they open them before you've opened the "admin" link, they will just see a "waiting for admin" screen. As they join, you will see the table begin to be populated.

## Writing phase

First, click "begin writing" to start the writing phase. Now the "writing progress" column will show which of the narratives participants are currently writing. When they confirm all their narratives, their "writing progress" will be "Done".

## Rating phase

When the writing is complete, click "begin ratings" to begin the rating phase.

<!-- # Technical details

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


This experiment structures it as follows: first, there is a "narratives" -->