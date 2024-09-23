module.exports = {
  apps: [
    {
      name: 'hebrew-calendar-ui',
      script: 'yarn start:prod',
      cwd: '/var/www/hebrew-calendar/packages/ui',
      env: process.env,
      autorestart: true,
    },
  ],
};
