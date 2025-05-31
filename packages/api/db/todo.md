# Data Structures

- Simplify `step_1` structure
	- `event_entry` (combine step_1 and step_2)
	- replace all references to step_1 and step_2 in triggers and views
	- allow for null hebrew_date and day_index
	- add "disabled" boolean

- consider aligning all names to `event_`

- Add "day of" for each of foub, sukkot, chanukah

- Add migration for "day before" each of the feasts (but just one day for each of foub, sukkot chanukah) [name should be 'day before']

- Add migration for "day after" each of the feasts (but just one day for each of foub, sukkot chanukah) [name should be 'day after']

- Add "day of the week" the materialized view for each date

- Add migration for event_pairs.favorite [boolean]

- Data migration for creating users (ryan and brandon) with passwords encrypted

# API

POST Auth

[guard the below endpoints with auth]

POST event_entry
	- Finds hebrew date
	- Inserts event_entry with hebrew_date and day_index

PATCH event_entry
	- Update name and description

DELETE event_entry
	- delete from event_entry; events; event_pairs; refresh materialized view

POST event_entry/sync
	- does not await response for the below (spins up child process)
	- checks if global var "is syncing" is true, if so, exit.
	- sets some global var to "is syncing"
	- looks for event_entry.processed = false
	- For each: Inserts to events table
			- Events table triggers event pairs to fan out
			- Set event_entry.processed = true
	- After: refresh materialized view

GET event_entry/sync 
	- get status of global var "is syncing" (boolean)

POST event_pair
	- event_pair.favorite [boolean]

GET event_pair
	- return list of pairs paginated and sort order
	- filter by anything (below)
	- sort by anything (below)

FILTERS

- Created By (a or b)
- Favorite (true or false)
- Gregorian/Hebrew between (a or b) on at least one
- Gregorian/Hebrew between (a or b) on the other
- Description contains (a or b)
- Tags contain (a or b) (any tags in any order)
- Days diff between
- Weeks between
- Enochian Years Between
- Revelation Years Between
- Is Exact weeks
- Is Exact enochian years
- Is Exact revelation years

# UI

## Structural 

- New UI login (admin.hebrewfeasts.com)
- New package (admin)
- API integration with token 

## Screens

- Login screen
- Event pairs screens
- Event create screen
- Event edit screen