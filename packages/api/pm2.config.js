module.exports = {
  apps: [
    {
      name: 'hebrew-calendar-api',
      script: 'yarn start:prod',
      cwd: '/var/www/hebrew-calendar/packages/api', 
      env: process.env, 
      autorestart: true,
    },
  ],
};
