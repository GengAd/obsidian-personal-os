# Obsidian Personal OS

## Introduction

The Obsidian Personal OS plugin is a powerful addition to Obsidian, designed to optimize your workflow by automating the management of tasks, reviews, and focus areas within your Obsidian environment. By alleviating the burden of decision-making regarding which file to prioritize, the plugin employs an automated selection process to direct your attention efficiently, drawing inspiration from the GTD (Getting Things Done) methodology. However, strict adherence to GTD principles is not mandatory for benefiting from this tool.

## Features Overview

1. **Start Work Command**: Automatically selects the next file that requires an action:
    - Can bring Random Events 
    - Automatically opens the appropriate workspace.
2. **Start Process Command**: Identifies the next file in need of processing or task creation.
3. **Find Recurring Subject**: Helps identify files for review at your convenience, beneficial for spaced repetition learning.
4. **Random Snooze**: Allows for effortless planning by randomly snoozing a file within a specified date range.
5. **Auto Fail Tasks**: Marks tasks as failed for items not completed, useful for recurring tasks during periods of absence.
    - Applicable to the current file or across the entire vault.
6. **Task Logger**: Records completed tasks in your daily note, configurable in the settings.

## Prerequisites

This plugin leverages functionality from three community plugins:

- **Dataview**: Essential for database queries.
- **Tasks**: Necessary for task management.
- **Completed Task Display**: Recommended for managing visibility of recurring tasks.

## Key Concepts

### Vault Structure

It is recommended that your vault contains at least one "Inbox" folder for new files and a "Work In Progress" folder for items requiring attention. These folder names are customizable and are specified within the plugin settings.

Example : 

![PersOsReadme01.png](./assets/images/PersOSReadme01.png)

#### Inbox Folders

Serve as initial holding areas for unprocessed items. Files in these folders need to be moved elsewhere to be excluded from the "start process" feature. An empty setting implies the entire vault functions as an "Inbox".

#### Work in Progress Folders

Represent areas for active items that are not archived. Items without a "Handled By" property or not marked as "Archived" with at least one next action are considered active (see file anatomy). 
The "Start Work" command also only look into the "Work in progress" folders to find actionable files. 
An empty setting designates the entire vault as a "Work in Progress" area.

### File Anatomy

The plugin uses 2 major properties in your files, we advise using the core obsidian "Properties view" plugin  : 

- **"Archived" Property**: (Optional) A True/False flag.
- **"Handled By" Property**: (Optional) Text property linking to another file.

Here is an example : 

![PersOsReadme02.png](./assets/images/PersOsReadme02.png)
#### Rules for "Work in progress" files:

- Non-archived files are active and require at least one task.
- Archived files are inactive and excluded from automatic prioritization.
- A "Handled By" file is active and still requires at least one task, but it's excluded from automatic prioritization.

### Task Anatomy

Understanding dates within tasks is crucial, as they dictate the task's visibility and priority:

- **Start Date**: The earliest date a task becomes relevant.
- **Scheduled Date**: The planned date for task execution.
- **Due Date**: The final deadline for task completion.

#### 🛫Start Date
This date represents the date when you CAN "Start" doing this task. Before that date there is no need for the system to bring the file to your attention, but after that date it will in the "Start Work" command. 

#### ⏳Scheduled Date (or Do Date)
This date represent the date when you SCHEDULED to work on this task. Before that date there is no need for the system to bring the file to your attention, but at the desired date it needs to be brought to attention!
A task having a start date AND a scheduled date will not come before the schedule date. 
A task having a scheduled date in the past is considered **late** but **not failed**. 

#### 📅Due Date
This date represent the ultimate possible date where this task should be finished. Before that date, the file can be brought to your attention if it has a start date or a scheduled date. 
A task having a Due date in the past is considered **late** and **failed**. 

#### ⌚ Time 
It's possible to add a time to a task (before the date and the recurrence). by using the "⌚" emoji (Windows + . on windows). 
A timed task will only be brought to attention after the dedicated time and with a high priority.  Time is in 24h format, here is an example : ⌚15:00 for 3pm.  See Start work feature for more info.

#### Tasks example 
- [ ] Study for exam 🛫 2024-03-05 📅 2024-03-15 

This task means that you "can" study between the 05th and the 15th of March. 
- It will show starting on the 05th and until the 15th
- It will be considered late and failed on the 16th


- [ ] Study for exam⌚15:00 🛫 2024-03-05 ⏳ 2024-03-11 📅 2024-03-15 

This task means that you "Can" study between the 05th and the 15th of March. 
You've scheduled to actually study on the 11th. 
- It won't show before the 11th at 15:00. 
- It will be considered late on the 12th. 
- It will be considered late and failed on the 16th

## Types for files

Some concepts are useful to understand : 
- A **due file** has at least 1 task with a scheduled or due date on the current day. 
- A **Next file** has at least 1 task with a start date in the past OR a file with only non dated tasks. 
- A **late file** is a file with at least 1 task that is scheduled or Due in the past. 

Those concepts are used very often in all the algorithms of the plugin features. 
## Features 
### Start Work Command

This feature brings forward files requiring immediate action, prioritizing based on dates, time and priority. 
Start work only brings files that are not archived, not "Handled By" another file, and in a "Work in progress" folder. 
The command uses a very specific algorithm to prioritize files to bring to your attention. 


- Due files with a time (⌚) in the past, ordered by time. 
- Random due file with no time (Random groups are created by priority, the high priority tasks will come first)
- Random next file 

#### Start Work Random Event
It is possible to configure "Random Events" tags in the settings. 

![PersOsReadme03.png](./assets/images/PersOsReadme03.png)

The start work feature has a 10% chance to bring a random file from those random events. 


#### Start Work Automatic Workspace opening
If a file can contain a "Workspace" property containing a Workspace name, when start work brings this file to your attention it will automatically open the referenced workspace. 


### Start Process Command
Facilitates vault organization by highlighting files needing review or task assignment, prioritizing late tasks and inbox items.

The priority system for Start process works as follow : 
- Late files 
- Files in 1 of your Inboxes
- Files "In progress without a task ", meaning non archived files in one of your "work in progress" folders that does not have a task defined. 


### Random snooze a file command
Simplifies planning by allowing random postponement of tasks within a chosen timeframe.

![PersOsReadme05.png](./assets/images/PersOsReadme05.png)

It will replace in the current file any start date or scheduled date by a random future date in the chosen interval.


### Auto failing tasks command
Automates the marking of tasks as failed past their due date, maintaining accountability for recurring obligations.
If the task was a recurring task, the command will generate failed task until a current or future date is found. 
If the task was not a recurring task. The due date will be replaced by a scheduled date in the past. The idea is to keep a record of "not doing" the action but the file will still show in your "Late" files while processing so you can choose what to do with it. 

For example this task : 

![PersOsReadme06.png](./assets/images/PersOsReadme06.png)

Will become like this : 

![PersOsReadme07.png](./assets/images/PersOSReadme07.png)

And this task : 

![PersOsReadme08.png](./assets/images/PersOSReadme08.png)

Will become like this : 

![PersOsReadme09.png](./assets/images/PersOsReadme09.png)

It's possible to launch the Auto fail task command either in the current file Or in your whole vault. 


## Releases 
### 1.0.0: Initial Release

- The first release of Personal OS ! 
	- New : **Start Work Command**
	- New : **Start Process Command**
	- New : **Random Snooze**
	- New : **Auto Fail Tasks**