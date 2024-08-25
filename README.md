# Hebrew Calendar API

Calendar for generating calendar data inclusive of 
- Julian Calendar
- Hebrew Calendar (according to Torah)
- Lunar Data
- etc.

## Installation

### Clone Repo 
```bash
$ git clone git@github.com:anon-r-7/hebrew-calendar.git
```

### Env Vars

```
export MYVAR=
```

## Usage

### Start

```bash
$ docker compose up
````

#### Lint Fix
```bash
$ yarn lint:fix
$ yarn prettier:fix
```

#### Lint Check
```bash
$ yarn tsc
$ yarn lint
$ yarn prettier
```

## Development

### Contributing 

```bash
$ git checkout main
$ git pull origin main
$ git checkout -b feature/<my feature>
$ git push origin feature/<my feature>
Create PR from feature branch to main
```

### Deployment

- cd /var/www/hebrew-calendar
- sudo su
- git pull origin main
- direnv allow .

#### API and UI

- ps aux | grep docker-compose
- kill <pid>
- docker-compose up --build