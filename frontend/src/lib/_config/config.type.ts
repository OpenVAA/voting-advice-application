export type AppConfig = Readonly<{
  dataProvider: DataProviderConfig;
}>;

type DataProviderConfig = {
  adapter: 'local' | 'strapi';
};
