# API

POST Auth

[guard the below endpoints with auth]

POST event_entry
	- Receives body { type: gregorian | hebrew, date: 'yyyy-mm-dd' [for both hebrew and gregorian ]}
	- Finds hebrew date based on gregorian (hebrew_dates.gregorian) or hebrew (hebrew_dates.yy .mm .dd)
	- Inserts event_entry with hebrew_date and day_index of hebrew_date

PATCH event_entry/:uuid
	- Update name and description based on event_entry.uuid

GET event_entry
  - Gets list of event_entry; filterable by created_by; ordered by date
  - should return hebrew_date as an object (rather than hebrew_date.uuid) with everything else

DELETE event_entry/:uuid
	- delete from event_entry based on uuid; events; event_pairs; refresh materialized view

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

PATCH event_pair/:uuid
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
- Day of the week

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