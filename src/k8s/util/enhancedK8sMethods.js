import { get } from 'lodash';

import { K8sCreateError, K8sGetError, K8sKillError, K8sMultipleErrors, K8sPatchError } from './errors';
import { findModel } from '../../models';
import { getFullResourceId } from '../../utils';

export const HISTORY_TYPE_GET = 'get';
export const HISTORY_TYPE_CREATE = 'create';
export const HISTORY_TYPE_PATCH = 'patch';
export const HISTORY_TYPE_DELETE = 'delete';
export const HISTORY_TYPE_NOT_FOUND = 'notFound';

export class HistoryItem {
  constructor(type, resource, initialResource) {
    this.type = type;
    this.resource = resource;
    this.initialResource = initialResource;
  }
}

export class EnhancedK8sMethods {
  constructor({ k8sGet, k8sCreate, k8sPatch, k8sKill }) {
    this._history = [];
    this._k8sGet = k8sGet;
    this._k8sCreate = k8sCreate;
    this._k8sPatch = k8sPatch;
    this._k8sKill = k8sKill;
  }

  _appendHistory = (historyItem, enhancedOpts) => {
    if (!enhancedOpts || !enhancedOpts.disableHistory) {
      this._history.push(historyItem);
    }
  };

  k8sGet = async (kind, name, namespace, opts, enhancedOpts) => {
    try {
      const result = await this._k8sGet(kind, name, namespace, opts);
      this._appendHistory(new HistoryItem(HISTORY_TYPE_GET, result, { metadata: { name, namespace } }), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sGetError(error.message, { name, namespace });
    }
  };

  k8sCreate = async (kind, data, opts, enhancedOpts) => {
    try {
      const result = await this._k8sCreate(kind, data, opts);
      this._appendHistory(new HistoryItem(HISTORY_TYPE_CREATE, result, data), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sCreateError(error.message, data);
    }
  };

  k8sPatch = async (kind, resource, patches, enhancedOpts) => {
    try {
      const result = await this._k8sPatch(kind, resource, patches);
      this._appendHistory(new HistoryItem(HISTORY_TYPE_PATCH, result, resource), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sPatchError(error.message, resource, patches);
    }
  };

  k8sKill = async (kind, resource, opts, json, enhancedOpts) => {
    try {
      const result = await this._k8sKill(kind, resource, opts, json);
      this._appendHistory(new HistoryItem(HISTORY_TYPE_DELETE, null, resource), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sKillError(error.message, error.json, resource);
    }
  };

  getHistory = () => [...this._history];

  // replay history and resolve actual state
  getActualState = () => {
    const currentIndexes = {};
    const currentUnfilteredState = [];

    this._history.forEach(({ type, resource, initialResource }) => {
      const id = getFullResourceId(resource || initialResource); // HISTORY_TYPE_DELETE
      const currentIdx = currentIndexes[id];
      switch (type) {
        case HISTORY_TYPE_PATCH:
          break;
        case HISTORY_TYPE_CREATE:
          resource = initialResource;
        case HISTORY_TYPE_GET:
          if (currentIdx != null && currentIdx >= 0) {
            currentUnfilteredState[currentIdx] = resource;
          } else {
            currentIndexes[id] = currentUnfilteredState.push(resource) - 1;
          }
          break;
        case HISTORY_TYPE_DELETE:
        case HISTORY_TYPE_NOT_FOUND:
          currentUnfilteredState[currentIdx] = null;
          currentIndexes[id] = null;
          break;
        default:
          break;
      }
    });

    return currentUnfilteredState.filter(a => a);
  };

  rollback = async () => {
    const state = this.getActualState();
    const errors = [];
    const deleteStatuses = [];

    // delete one by one in reverse order resources were created in
    for (let i = state.length - 1; i >= 0; i--) {
      let obj;
      try {
        obj = state[i];
        // eslint-disable-next-line no-await-in-loop
        const result = await this.k8sKill(findModel(obj), obj);
        deleteStatuses.push(result);
      } catch (error) {
        if (get(error, 'json.code') === 404 || get(error, 'json.reason') === 'NotFound') {
          // happy path
          this._appendHistory(new HistoryItem(HISTORY_TYPE_NOT_FOUND, null, obj));
          deleteStatuses.push(error.json);
        } else {
          errors.push(error);
        }
      }
    }

    if (errors.length > 0) {
      throw new K8sMultipleErrors('rollback', errors);
    }

    return deleteStatuses;
  };
}
