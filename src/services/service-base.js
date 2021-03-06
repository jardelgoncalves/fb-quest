import logger from '@src/logger';
import { errorResponse, successResponse } from '@src/utils/response';

export class ServiceBase {
  constructor({ serviceManager, model, schema, alias }) {
    this.serviceManager = serviceManager;
    this.Model = model;
    this.schema = schema || undefined;
    this.alias = alias || 'recurso';
  }

  handleError(error) {
    if (error.message && /Cast to ObjectId/.test(error.message)) {
      return errorResponse({ error: 'id informado é inválido' }, 400);
    }
    return errorResponse({ error: error.message }, 422);
  }

  async _applySchema(fnOperation, data) {
    try {
      if (this.schema) await this.schema.validate(data);
      const response = await fnOperation();
      return response;
    } catch (error) {
      logger.error(`Validation Error: ${error.message}`);
      return this.handleError(error);
    }
  }

  async doCreate({ data }) {
    const entity = new this.Model(data);
    await entity.save();

    return successResponse(entity, 201);
  }

  async doFindOne({ query = {}, populate = {} }) {
    const entity = await this.Model.findOne(query).populate(
      populate.table || '',
      populate.fields || ''
    );

    if (!entity)
      return errorResponse({ error: `${this.alias} não encontrado(a)!` });

    return successResponse(entity, 200);
  }

  async doFindAll({ query = {}, populate = {} }) {
    const entity = await this.Model.find(query || {}).populate(
      populate.table || '',
      populate.fields || ''
    );
    return successResponse(entity, 200);
  }

  async doUpdate({ query = {}, data = {} }) {
    const entity = await this.Model.findOne(query || {});
    entity.set(data);
    await entity.save();

    return successResponse(entity, 200);
  }

  async doDelete({ query }) {
    await this.Model.deleteOne(query || {});
    return successResponse({}, 204);
  }

  async create({ data }) {
    return this._applySchema(() => this.doCreate({ data }), data);
  }

  async findOne({ query = {}, populate = {} }) {
    try {
      const response = await this.doFindOne({ query, populate });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async findAll({ query = {}, populate = {} }) {
    try {
      const response = await this.doFindAll({ query, populate });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update({ query = {}, data = {} }) {
    return this._applySchema(() => this.doUpdate({ query, data }), data);
  }

  async delete({ query }) {
    try {
      const response = await this.doDelete({ query });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }
}
