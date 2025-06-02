module.exports = {
  apps: [
    {
      name: 'hebrew-calendar-admin',
      script: 'yarn start:prod',
      cwd: '/var/www/hebrew-calendar/packages/admin',
      env: process.env,
      autorestart: true,
    },
  ],
};
