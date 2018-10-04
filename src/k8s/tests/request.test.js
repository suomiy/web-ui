import { createVM } from '../request';
import { ProcessedTemplatesModel } from '../../models';
import {
  CUSTOM_FLAVOR,
  PROVISION_SOURCE_PXE,
  PROVISION_SOURCE_REGISTRY,
  PROVISION_SOURCE_URL,
  PARAM_VM_NAME
} from '../../constants';

import { templates, storages } from '../../components/Wizards/NewVmWizard/fixtures/NewVmWizard.fixture';

const basicSettings = {
  name: {
    value: 'name'
  },
  namespace: {
    value: 'namespace'
  },
  imageSourceType: {
    value: PROVISION_SOURCE_REGISTRY
  },
  registryImage: {
    value: 'imageURL'
  },
  flavor: {
    value: 'small'
  }
};

const attachStorageDisks = [
  {
    id: 1,
    isBootable: true,
    attachStorage: storages[2]
  }
];

const basicSettingsCloudInit = {
  name: {
    value: 'name'
  },
  namespace: {
    value: 'namespace'
  },
  imageSourceType: {
    value: PROVISION_SOURCE_REGISTRY
  },
  registryImage: {
    value: 'imageURL'
  },
  flavor: {
    value: 'small'
  },
  cloudInit: {
    value: true
  },
  hostname: {
    value: 'hostname'
  },
  authKeys: {
    value: 'keys'
  }
};

const vmFromURL = {
  name: {
    value: 'name'
  },
  namespace: {
    value: 'namespace'
  },
  description: {
    value: 'desc'
  },
  imageSourceType: {
    value: PROVISION_SOURCE_URL
  },
  imageURL: {
    value: 'httpURL'
  },
  flavor: {
    value: 'small'
  }
};

const vmPXE = {
  name: {
    value: 'name'
  },
  namespace: {
    value: 'namespace'
  },
  description: {
    value: 'desc'
  },
  imageSourceType: {
    value: PROVISION_SOURCE_PXE
  },
  flavor: {
    value: 'small'
  },
  startVM: {
    value: true
  }
};

const customFlavor = {
  name: {
    value: 'name'
  },
  namespace: {
    value: 'namespace'
  },
  description: {
    value: 'desc'
  },
  imageSourceType: {
    value: PROVISION_SOURCE_REGISTRY
  },
  registryImage: {
    value: 'imageURL'
  },
  flavor: {
    value: CUSTOM_FLAVOR
  },
  cpu: {
    value: '1'
  },
  memory: {
    value: '1'
  },
  startVM: {
    value: true
  }
};

const processTemplate = template =>
  new Promise((resolve, reject) => {
    const nameParam = template.parameters.find(param => param.name === PARAM_VM_NAME);
    template.objects[0].metadata.name = nameParam.value;
    resolve(template);
  });

export const k8sCreate = (model, resource) => {
  if (model === ProcessedTemplatesModel) {
    return processTemplate(resource);
  }
  return new Promise(resolve => resolve(resource));
};

const testFirstAttachedStorage = (vm, volumeIndex, disksIndex, bootOrder) => {
  const storage = attachStorageDisks[0];
  const attachStorageName = storage.attachStorage.id;

  expect(vm.spec.template.spec.volumes[volumeIndex].name).toBe(attachStorageName);
  expect(vm.spec.template.spec.volumes[volumeIndex].persistentVolumeClaim.claimName).toBe(attachStorageName);
  expect(vm.spec.template.spec.domain.devices.disks[disksIndex].name).toBe(attachStorageName);
  expect(vm.spec.template.spec.domain.devices.disks[disksIndex].volumeName).toBe(attachStorageName);
  expect(vm.spec.template.spec.domain.devices.disks[disksIndex].bootOrder).toBe(
    storage.isBootable ? bootOrder : undefined
  );
};

const testRegistryImage = vm => {
  expect(vm.metadata.name).toBe(basicSettings.name.value);
  expect(vm.metadata.namespace).toBe(basicSettings.namespace.value);
  expect(vm.spec.template.spec.domain.devices.disks[0].name).toBe('rootdisk');
  expect(vm.spec.template.spec.domain.devices.disks[0].volumeName).toBe('rootvolume');

  expect(vm.spec.template.spec.volumes[0].name).toBe('rootvolume');
  expect(vm.spec.template.spec.volumes[0].registryDisk.image).toBe('imageURL');
  return vm;
};

const testPXE = vm => {
  expect(vm.metadata.name).toBe(basicSettings.name.value);
  expect(vm.metadata.namespace).toBe(basicSettings.namespace.value);
  expect(vm.spec.template.spec.domain.devices.interfaces[0].bootOrder).toBe(1);
  return vm;
};

describe('request.js', () => {
  it('registryImage', () => createVM(k8sCreate, templates, basicSettings).then(testRegistryImage));
  it('from URL', () =>
    createVM(k8sCreate, templates, vmFromURL).then(vm => {
      expect(vm.metadata.name).toBe(basicSettings.name.value);
      expect(vm.metadata.namespace).toBe(basicSettings.namespace.value);
      expect(vm.spec.template.spec.domain.devices.disks[0].name).toBe('rootdisk');
      expect(vm.spec.template.spec.domain.devices.disks[0].volumeName).toBe('rootvolume');

      expect(vm.spec.template.spec.volumes[0].name).toBe('rootvolume');
      const dataVolumeName = `datavolume-${vmFromURL.name.value}`;
      expect(vm.spec.template.spec.volumes[0].dataVolume.name).toBe(dataVolumeName);

      expect(vm.spec.dataVolumeTemplates[0].metadata.name).toBe(dataVolumeName);
      expect(vm.spec.dataVolumeTemplates[0].spec.source.http.url).toBe(vmFromURL.imageURL.value);
      return vm;
    }));
  it('from PXE', () => createVM(k8sCreate, templates, vmPXE).then(testPXE));
  it('with CloudInit', () =>
    createVM(k8sCreate, templates, basicSettingsCloudInit).then(vm => {
      expect(vm.metadata.name).toBe(basicSettings.name.value);
      expect(vm.metadata.namespace).toBe(basicSettings.namespace.value);
      expect(vm.spec.template.spec.domain.devices.disks[1].name).toBe('cloudinitdisk');
      expect(vm.spec.template.spec.domain.devices.disks[1].volumeName).toBe('cloudinitvolume');

      expect(vm.spec.template.spec.volumes[1].name).toBe('cloudinitvolume');
      return vm;
    }));
  it('with custom flavor', () =>
    createVM(k8sCreate, templates, customFlavor).then(vm => {
      expect(vm.metadata.name).toBe(basicSettings.name.value);
      expect(vm.metadata.namespace).toBe(basicSettings.namespace.value);
      expect(vm.spec.template.spec.domain.cpu.cores).toBe(1);
      expect(vm.spec.template.spec.domain.resources.requests.memory).toBe('1G');
      return vm;
    }));

  it('registryImage with attached disks', () =>
    createVM(k8sCreate, templates, basicSettings, attachStorageDisks).then(vm => {
      testRegistryImage(vm);
      testFirstAttachedStorage(vm, 1, 1, 1);
      return vm;
    }));

  it('from PXE with attached disks', () =>
    createVM(k8sCreate, templates, vmPXE, attachStorageDisks).then(vm => {
      testPXE(vm);
      testFirstAttachedStorage(vm, 0, 1, 2);
      return vm;
    }));
});
