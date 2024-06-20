import type {DataProviderType} from '$lib/_api/dataProvider.type';

export type AppConfig = Readonly<{
  dataProvider: DataProviderConfig;
}>;

type DataProviderConfig = {
  adapter: 'local' | 'strapi';
  type: DataProviderType;
};
