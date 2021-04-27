module.exports = {
  apps: [
    {
      name: 'feed',
      script: './build/app.js',
      args: '',
      cwd: '/www/feed/',
      watch: false,
      interpreter: 'node',
      instance_var: 'INSTANCE_ID',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    }
  ],
};
