import { ensureColors } from '$lib/utils/color/ensureColors';
import { UniversalAdapter } from './universalAdapter';
import type { DataObjectData } from '@openvaa/data';
import type { DataProvider, DPReturnType } from './dataProvider.type';
import type { DPDataType } from './dataTypes';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetElectionsOptions,
  GetEntitiesOptions,
  GetNominationsOptions,
  GetQuestionsOptions
} from './getDataOptions.type';

/**
 * The abstract base class that all universal `DataProvider`s should extend. It implements error handling and pre-processing of raw data before it is provided to the `DataRoot`, such as color constrast enhancements.
 *
 * The subclasses must implement the protected `_getFoo` methods paired with each public `getFoo` method.
 */
export abstract class UniversalDataProvider extends UniversalAdapter implements DataProvider {
  /////////////////////////////////////////////////////////////////////
  // PUBLIC DATA GETTERS
  /////////////////////////////////////////////////////////////////////

  getAppSettings(): DPReturnType<'appSettings'> {
    return this._getAppSettings();
  }

  getAppCustomization(options?: GetAppCustomizationOptions): DPReturnType<'appCustomization'> {
    return this._getAppCustomization(options);
  }

  getElectionData(options?: GetElectionsOptions): DPReturnType<'elections'> {
    return this._getElectionData(options);
  }

  getConstituencyData(options?: GetConstituenciesOptions): DPReturnType<'constituencies'> {
    return this._getConstituencyData(options);
  }

  getNominationData(options?: GetNominationsOptions): DPReturnType<'nominations'> {
    return this._getNominationData(options).then(({ entities, nominations }) => ({
      entities: this.ensureColors(entities),
      nominations
    }));
  }

  getEntityData(options?: GetEntitiesOptions): DPReturnType<'entities'> {
    return this._getEntityData(options).then((data) => this.ensureColors(data));
  }

  getQuestionData(options?: GetQuestionsOptions): DPReturnType<'questions'> {
    return this._getQuestionData(options).then(({ categories, questions }) => ({
      categories: this.ensureColors(categories),
      questions
    }));
  }

  /////////////////////////////////////////////////////////////////////
  // UTILITIES
  /////////////////////////////////////////////////////////////////////

  /**
   * Call `ensureColors` for all the objects in the array to ensure their contrast values.
   * @param objects
   */
  ensureColors<TData extends DataObjectData>(objects: Array<TData>): Array<TData> {
    return objects.map((o) => (o.color ? { ...o, color: ensureColors(o.color) } : o));
  }

  /////////////////////////////////////////////////////////////////////
  // PROTECTED INTERNAL GETTERS TO BE IMPLEMENTED BY SUBCLASSES
  /////////////////////////////////////////////////////////////////////

  protected abstract _getAppSettings(): Promise<DPDataType['appSettings']>;
  protected abstract _getAppCustomization(
    options?: GetAppCustomizationOptions
  ): Promise<DPDataType['appCustomization']>;
  protected abstract _getElectionData(options?: GetElectionsOptions): Promise<DPDataType['elections']>;
  protected abstract _getConstituencyData(options?: GetConstituenciesOptions): Promise<DPDataType['constituencies']>;
  protected abstract _getNominationData(options?: GetNominationsOptions): Promise<DPDataType['nominations']>;
  protected abstract _getEntityData(options?: GetEntitiesOptions): Promise<DPDataType['entities']>;
  protected abstract _getQuestionData(options?: GetQuestionsOptions): Promise<DPDataType['questions']>;
}
