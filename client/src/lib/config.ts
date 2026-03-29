/**
 * @description stores global configuration
 * FIXME: update to use a backend api to fetch config on startup
 * and store the configs inside store
 */
export const config = {
  backendURL: 'localhost:3000',
  dbName: 'sqlite:zenith.db',
  vaultName: 'vault.hold',
  globalStoreName: 'settings.json'
};
