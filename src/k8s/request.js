import { cloneDeep, get, remove } from 'lodash';
import { safeDump } from 'js-yaml';
import {
  VM_KIND,
  CLOUDINIT_DISK,
  CLOUDINIT_VOLUME,
  VIRTIO_BUS,
  ANNOTATION_DEFAULT_DISK,
  ANNOTATION_DEFAULT_NETWORK,
  PARAM_VM_NAME,
  CUSTOM_FLAVOR,
  PROVISION_SOURCE_REGISTRY,
  PROVISION_SOURCE_URL,
  DEFAULT_NETWORK_NAME
} from '../constants';
import { VirtualMachineModel, ProcessedTemplatesModel } from '../models';
import { getTemplatesWithLabels } from '../utils/template';
import { getOsLabel, getWorkloadLabel, getFlavorLabel, getChosenTemplateAnnotations } from './selectors';

export const createVM = (k8sCreate, templates, basicSettings, storage) => {
  const availableTemplates = getTemplatesWithLabels(templates, [
    getOsLabel(basicSettings),
    getWorkloadLabel(basicSettings),
    getFlavorLabel(basicSettings)
  ]);

  basicSettings.chosenTemplate = availableTemplates.length > 0 ? cloneDeep(availableTemplates[0]) : null;

  setParameterValue(basicSettings.chosenTemplate, PARAM_VM_NAME, basicSettings.name.value);

  // no more required parameters
  basicSettings.chosenTemplate.parameters.forEach(param => {
    if (param.name !== PARAM_VM_NAME && param.required) {
      delete param.required;
    }
  });

  // processedtemplate endpoint is namespaced
  basicSettings.chosenTemplate.metadata.namespace = basicSettings.namespace.value;

  return k8sCreate(ProcessedTemplatesModel, basicSettings.chosenTemplate).then(response => {
    const vm = response.objects.find(obj => obj.kind === VM_KIND);
    modifyVmObject(vm, basicSettings, storage);
    return k8sCreate(VirtualMachineModel, vm);
  });
};

const setFlavor = (vm, basicSettings) => {
  if (basicSettings.flavor.value === CUSTOM_FLAVOR) {
    vm.spec.template.spec.domain.cpu.cores = parseInt(basicSettings.cpu.value, 10);
    vm.spec.template.spec.domain.resources.requests.memory = `${basicSettings.memory.value}G`;
  }
};

const setParameterValue = (template, paramName, paramValue) => {
  const parameter = template.parameters.find(param => param.name === paramName);
  parameter.value = paramValue;
};

const modifyVmObject = (vm, basicSettings, storages) => {
  setFlavor(vm, basicSettings);
  setSourceType(vm, basicSettings);

  // add running status
  vm.spec.running = basicSettings.startVM ? basicSettings.startVM.value : false;

  // add namespace
  if (basicSettings.namespace) {
    vm.metadata.namespace = basicSettings.namespace.value;
  }

  // add description
  if (basicSettings.description) {
    addAnnotation(vm, 'description', basicSettings.description.value);
  }

  addCloudInit(vm, basicSettings);
  addStorages(vm, basicSettings, storages);
};

const setSourceType = (vm, basicSettings) => {
  const defaultDiskName = getChosenTemplateAnnotations(basicSettings, ANNOTATION_DEFAULT_DISK);
  const defaultNetworkName = getChosenTemplateAnnotations(basicSettings, ANNOTATION_DEFAULT_NETWORK);

  const defaultDisk = getDefaultDevice(vm, 'disks', defaultDiskName);
  let defaultNetwork = getDefaultDevice(vm, 'interfaces', defaultNetworkName);

  remove(vm.spec.template.spec.volumes, volume => defaultDisk && volume.name === defaultDisk.volumeName);

  switch (get(basicSettings.imageSourceType, 'value')) {
    case PROVISION_SOURCE_REGISTRY: {
      const volume = {
        name: defaultDisk && defaultDisk.volumeName,
        registryDisk: {
          image: basicSettings.registryImage.value
        }
      };
      addVolume(vm, volume);
      break;
    }
    case PROVISION_SOURCE_URL: {
      const dataVolumeName = `datavolume-${basicSettings.name.value}`;
      const volume = {
        name: defaultDisk && defaultDisk.volumeName,
        dataVolume: {
          name: dataVolumeName
        }
      };
      const dataVolumeTemplate = {
        metadata: {
          name: dataVolumeName
        },
        spec: {
          pvc: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: '2Gi'
              }
            }
          },
          source: {
            http: {
              url: basicSettings.imageURL.value
            }
          }
        }
      };
      addDataVolumeTemplate(vm, dataVolumeTemplate);
      addVolume(vm, volume);
      break;
    }
    // PXE
    default: {
      if (!defaultNetwork) {
        defaultNetwork = {
          type: 'pod-network',
          name: DEFAULT_NETWORK_NAME,
          model: 'virtio'
        };
        addInterface(vm, defaultNetwork);
      }
      defaultNetwork.bootOrder = 1;
      addAnnotation(vm, 'firstRun', 'true');
      break;
    }
  }
};

const getDefaultDevice = (vm, deviceType, deviceName) =>
  get(vm.spec.template.spec.domain.devices, deviceType, []).find(device => device.name === deviceName);

const addCloudInit = (vm, basicSettings) => {
  // remove existing config
  const volumes = get(vm.spec.template.spec, 'volumes', []);
  remove(volumes, volume => volume.hasOwnProperty('cloudInitNoCloud'));

  if (get(basicSettings.cloudInit, 'value', false)) {
    const cloudInitDisk = {
      name: CLOUDINIT_DISK,
      volumeName: CLOUDINIT_VOLUME,
      disk: {
        bus: VIRTIO_BUS
      }
    };
    addDisk(vm, cloudInitDisk);

    const userDataObject = {
      users: [
        {
          name: 'root',
          'ssh-authorized-keys': basicSettings.authKeys.value
        }
      ],
      hostname: basicSettings.hostname.value
    };

    const userData = safeDump(userDataObject);

    const userDataWithMagicHeader = `#cloud-config\n${userData}`;

    const cloudInitVolume = {
      name: CLOUDINIT_VOLUME,
      cloudInitNoCloud: {
        userData: userDataWithMagicHeader
      }
    };

    addVolume(vm, cloudInitVolume);
  }
};

const addStorages = (vm, basicSettings, storages) => {
  if (storages) {
    for (const storage of storages) {
      if (storage.attachStorage) {
        addPersistentVolumeClaimVolume(vm, basicSettings, storage);
      } else {
        addDataVolume(vm, basicSettings, storage);
      }
    }
  }
};

const addDataVolume = (vm, basicSettings, volume) => {
  addDataVolumeTemplate({
    metadata: {
      name: volume.name
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      pvc: {
        resources: {
          requests: {
            storage: `${volume.size}Gi`
          }
        },
        storageClassName: volume.storageClass
      },
      source: {}
    },
    status: {}
  });

  addVolume(vm, {
    name: volume.name,
    dataVolume: {
      name: volume.name
    }
  });

  addBootableDisk(
    vm,
    basicSettings,
    {
      name: volume.name,
      volumeName: volume.name,
      disk: {}
    },
    volume.isBootable
  );
};

const addPersistentVolumeClaimVolume = (vm, basicSettings, volume) => {
  addVolume(vm, {
    name: volume.attachStorage.id,
    persistentVolumeClaim: {
      claimName: volume.attachStorage.id
    }
  });

  addBootableDisk(
    vm,
    basicSettings,
    {
      name: volume.attachStorage.id,
      volumeName: volume.attachStorage.id,
      disk: {}
    },
    volume.isBootable
  );
};

const addBootableDisk = (vm, basicSettings, diskSpec, isBootable) => {
  const defaultNetworkName = getChosenTemplateAnnotations(basicSettings, ANNOTATION_DEFAULT_NETWORK);

  let bootOrder;
  if (isBootable) {
    bootOrder = hasInterface(vm, defaultNetworkName) || hasInterface(vm, DEFAULT_NETWORK_NAME) ? 2 : 1;
  }

  addDisk(vm, diskSpec, bootOrder);
};

const addDisk = (vm, diskSpec, bootOrder) => {
  const domain = get(vm.spec.template.spec, 'domain', {});
  const devices = get(domain, 'devices', {});
  const disks = get(devices, 'disks', []);

  if (bootOrder) {
    diskSpec.bootOrder = bootOrder;
  }

  disks.push(diskSpec);
  devices.disks = disks;
  domain.devices = devices;
  vm.spec.template.spec.domain = domain;
};

const addVolume = (vm, volumeSpec) => {
  const volumes = get(vm.spec.template.spec, 'volumes', []);
  volumes.push(volumeSpec);
  vm.spec.template.spec.volumes = volumes;
};

const addDataVolumeTemplate = (vm, dataVolumeSpec) => {
  const dataVolumes = get(vm.spec, 'dataVolumeTemplates', []);
  dataVolumes.push(dataVolumeSpec);
  vm.spec.dataVolumeTemplates = dataVolumes;
};

const addInterface = (vm, interfaceSpec) => {
  const domain = get(vm.spec.template.spec, 'domain', {});
  const devices = get(domain, 'devices', {});
  const interfaces = get(devices, 'interfaces', []);
  interfaces.push(interfaceSpec);
  devices.interfaces = interfaces;
  domain.devices = devices;
  vm.spec.template.spec.domain = domain;
};

const hasInterface = (vm, networkName) => {
  const domain = get(vm.spec.template.spec, 'domain', {});
  const devices = get(domain, 'devices', {});
  return get(devices, 'interfaces', []).find(ifc => ifc.name === networkName);
};

const addAnnotation = (vm, key, value) => {
  const annotations = get(vm.metadata, 'annotations', {});
  annotations[key] = value;
  vm.metadata.annotations = annotations;
};
