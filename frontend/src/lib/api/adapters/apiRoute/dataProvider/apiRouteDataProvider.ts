import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { apiRouteAdapterMixin } from '../apiRouteAdapter';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetElectionsOptions,
  GetEntitiesOptions,
  GetFactorLoadingsOptions,
  GetNominationsOptions,
  GetQuestionsOptions
} from '$lib/api/base/getDataOptions.type';

export class ApiRouteDataProvider extends apiRouteAdapterMixin(UniversalDataProvider) {
  protected _getAppSettings(): Promise<DPDataType['appSettings']> {
    return this.apiGet({ endpoint: 'appSettings' });
  }

  protected _getAppCustomization(options?: GetAppCustomizationOptions): Promise<DPDataType['appCustomization']> {
    return this.apiGet({ endpoint: 'appCustomization', params: options });
  }

  protected _getElectionData(options?: GetElectionsOptions): Promise<DPDataType['elections']> {
    return this.apiGet({ endpoint: 'elections', params: options });
  }

  protected _getConstituencyData(options?: GetConstituenciesOptions): Promise<DPDataType['constituencies']> {
    return this.apiGet({ endpoint: 'constituencies', params: options });
  }

  protected _getNominationData(options?: GetNominationsOptions): Promise<DPDataType['nominations']> {
    return this.apiGet({ endpoint: 'nominations', params: options });
  }

  protected _getEntityData(options?: GetEntitiesOptions): Promise<DPDataType['entities']> {
    return this.apiGet({ endpoint: 'entities', params: options });
  }

  protected _getQuestionData(options?: GetQuestionsOptions): Promise<DPDataType['questions']> {
    return this.apiGet({ endpoint: 'questions', params: options });
  }

  protected _getFactorLoadingData(options: GetFactorLoadingsOptions): Promise<DPDataType['factorLoadings']> {
    return this.apiGet({ endpoint: 'factorLoadings', params: options });
  }
}
