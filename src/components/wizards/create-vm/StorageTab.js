import React from 'react';
import PropTypes from 'prop-types';
import { findIndex, get } from 'lodash';
import { Button, ButtonGroup } from 'patternfly-react';

import EditableDraggableTable from '../../table/EditableDraggableTable';

import {
  ACTIONS_TYPE,
  DELETE_ACTION,
  ON_CHANGE,
  ON_ACTIVATE,
  ON_CONFIRM,
  ON_DELETE,
  ON_MOVE,
  ON_CANCEL
} from '../../table/constants';

import './StorageTab.css';

const BOOTABLE = '(Bootable)';

const validateDisk = disk => {
  const errors = Array(4).fill(null);

  if (!disk || disk.id == null) {
    errors[0] = 'Empty entity.'; // row error on index 0
  }

  if (!disk.name) {
    errors[1] = 'Name is empty';
  }

  if (!disk.size || disk.size <= 0) {
    errors[2] = 'Size must be positive';
  }

  if (!disk.storageClass) {
    errors[3] = 'Storage Class not selected';
  }

  return {
    ...disk,
    errors
  };
};

const validateAttachStorage = storage => {
  const errors = Array(4).fill(null);
  if (!storage || storage.id == null) {
    errors[0] = 'Empty entity.'; // row error on index 0
  }

  if (!storage.attachStorage || storage.attachStorage.id == null) {
    errors[1] = 'Storage not selected.';
  }

  return {
    ...storage,
    errors
  };
};

const resolveBootability = rows => {
  if (rows && rows.length > 0 && !rows[0].isBootable) {
    // change detected
    let isBootable = true;
    return rows.map(row => {
      const result = {
        ...row,
        isBootable,
        addendum: isBootable ? BOOTABLE : null
      };
      if (isBootable) {
        // only the first one is bootable
        isBootable = false;
      }
      return result;
    });
  }
  return rows;
};

const resolveAttachedStorage = (disk, storages, storageClasses) => {
  const attachStorage = storages.find(storage => storage.id === disk.name) || disk.attachStorage;
  return {
    ...disk,
    attachStorage,
    // just for visualisation
    name: attachStorage.name,
    size: attachStorage.size,
    storageClass: get(storageClasses.find(clazz => clazz.id === attachStorage.storageClass), 'name')
  };
};

const resolveInitialDisks = (initialDisks, storages, storageClasses) => {
  const disks = initialDisks.map(disk => {
    let result;

    if (disk.attachStorage) {
      result = {
        ...resolveAttachedStorage(disk, storages, storageClasses),
        renderConfig: 1
      };
    } else {
      result = {
        ...disk,
        renderConfig: 0
      };
    }

    result.isBootable = false; // clear to prevent mistakes and resolve again (adds addendum)

    return result;
  });

  return resolveBootability(disks);
};

const resolveValidation = rows => rows.map(row => (row.attachStorage ? validateAttachStorage(row) : validateDisk(row)));

const publishResults = (rows, publish) => {
  let valid = true;

  const disks = rows.map(({ attachStorage, id, name, size, storageClass, isBootable, errors }) => {
    const result = attachStorage
      ? {
          attachStorage,
          id,
          isBootable
        }
      : {
          id,
          name,
          size,
          storageClass,
          isBootable
        };

    if (valid && errors) {
      for (const error of errors) {
        if (error) {
          valid = false;
          break;
        }
      }
    }
    return result;
  });

  publish(disks, valid);
};

class StorageTab extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // eslint-disable-next-line react/no-unused-state
      nextId: Math.max(...props.initialDisks.map(disk => disk.id), 0) + 1,
      rows: resolveInitialDisks(props.initialDisks, props.storages, props.storageClasses),
      editing: false
    };
  }

  onChange = (rows, { editing, type, id }) => {
    if (type === ON_CHANGE) {
      const index = findIndex(rows, { id });
      const row = rows[index];

      if (row.attachStorage) {
        rows[index] = resolveAttachedStorage(row, this.props.storages, this.props.storageClasses);
      }
    }

    switch (type) {
      case ON_CONFIRM:
      case ON_CANCEL: // to detect first row
      case ON_DELETE:
        rows = resolveValidation(rows);
        break;
      default:
        break;
    }

    switch (type) {
      case ON_ACTIVATE: // new row
      case ON_DELETE:
      case ON_MOVE:
        rows = resolveBootability(rows);
        break;
      default:
        break;
    }

    this.setState({
      rows,
      editing
    });

    switch (type) {
      case ON_ACTIVATE: // new empty data
      case ON_CONFIRM: // new data
      case ON_DELETE:
      case ON_MOVE:
        publishResults(rows, this.props.onChange);
        break;
      default:
        break;
    }
  };

  create = (renderConfig, values = {}) => {
    this.setState(state => ({
      nextId: state.nextId + 1,
      rows: [
        ...state.rows,
        {
          id: state.nextId,
          isBootable: false,
          edit: true, // trigger immediate edit
          renderConfig,
          ...values
        }
      ]
    }));
  };

  createDisk = () => this.create(0);

  attachStorage = () => this.create(1, { attachStorage: {} });

  render() {
    const columns = [
      {
        header: {
          label: 'Disk Name',
          props: {
            style: {
              width: '50%'
            }
          }
        },
        property: 'name',
        renderConfigs: [
          {
            id: 'name-edit',
            type: 'text',
            hasAddendum: true
          },
          {
            id: 'name-attach-edit',
            type: 'dropdown',
            choices: this.props.storages,
            initialValue: '--- Select Storage ---',
            hasAddendum: true
          }
        ]
      },
      {
        header: {
          label: 'Size (GB)',
          props: {
            style: {
              width: '23%'
            }
          }
        },
        property: 'size',
        renderConfigs: [
          {
            id: 'size-edit',
            type: 'positive-number'
          }
        ]
      },
      {
        header: {
          label: 'Storage Class',
          props: {
            style: {
              width: '23%'
            }
          }
        },
        property: 'storageClass',

        renderConfigs: [
          {
            id: 'storage-edit',
            type: 'dropdown',
            choices: this.props.storageClasses,
            initialValue: '--- Select ---'
          }
        ]
      },
      {
        header: {
          props: {
            style: {
              width: '4%'
            }
          }
        },

        renderConfigs: [
          {
            id: 'actions',
            type: ACTIONS_TYPE,
            actions: [DELETE_ACTION],
            visibleOnEdit: false
          },
          {
            id: 'actions',
            type: ACTIONS_TYPE,
            actions: [DELETE_ACTION],
            visibleOnEdit: false
          }
        ]
      }
    ];

    // TODO: create disk button will have `disabled={this.state.editing}` once the create blank disk feature is implemented in kubevirt
    return (
      <React.Fragment>
        <ButtonGroup className="pull-right actions">
          <Button className="create-disk" onClick={this.createDisk} disabled id="create-disk-btn">
            Create Disk
          </Button>
          <Button onClick={this.attachStorage} disabled={this.state.editing} id="attach-storage-btn">
            Attach Storage
          </Button>
        </ButtonGroup>
        <EditableDraggableTable columns={columns} rows={this.state.rows} onChange={this.onChange} />
      </React.Fragment>
    );
  }
}

StorageTab.defaultProps = {
  initialDisks: []
};

StorageTab.propTypes = {
  storageClasses: PropTypes.array.isRequired,
  storages: PropTypes.array.isRequired,
  initialDisks: PropTypes.array, // StorageTab keeps it's own state
  onChange: PropTypes.func.isRequired
};

export default StorageTab;
