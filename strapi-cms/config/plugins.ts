export default ({ env }) => ({
  'users-permissions': {
    config: {
      providers: {
        google: {
          enabled: true,
          icon: 'google',
          key: env('GOOGLE_CLIENT_ID'),
          secret: env('GOOGLE_CLIENT_SECRET'),
          callback: `${env('PUBLIC_URL', 'https://cms.arkiv.network')}/api/auth/google/callback`,
          scope: ['email', 'profile'],
        },
      },
    },
  },
});
