import { NewVmWizard } from '..';
import { fedora28 } from '../../../../k8s/mock_templates/fedora28.template';
import { rhel75 } from '../../../../k8s/mock_templates/rhel75.template';
import { ubuntu1804 } from '../../../../k8s/mock_templates/ubuntu1804.template';
import { rhelHighPerformance } from '../../../../k8s/mock_templates/rhel-high-p.template';
import { ProcessedTemplatesModel } from '../../../../models';

export const templates = [fedora28, ubuntu1804, rhel75, rhelHighPerformance];

export const namespaces = [
  {
    metadata: {
      name: 'default'
    }
  },
  {
    metadata: {
      name: 'myproject'
    }
  }
];

export const storageClasses = [
  {
    name: 'NFS',
    id: 'nfs'
  },
  {
    name: 'iSCSI',
    id: 'iscsi'
  },
  {
    name: 'Glusterfs',
    id: 'glusterfs'
  },
  {
    name: 'AzureDisk',
    id: 'azuredisk'
  },
  {
    name: 'Local',
    id: 'local'
  }
];

export const storages = [
  {
    id: 'disk-one',
    name: 'disk One',
    size: '10',
    storageClass: 'nfs'
  },
  {
    id: 'disk-two',
    name: 'disk Two',
    size: '15',
    storageClass: 'glusterfs'
  },
  {
    id: 'disk-three',
    name: 'disk Three',
    size: '20',
    storageClass: 'iscsi'
  }
];

const processTemplate = template =>
  new Promise((resolve, reject) => {
    const nameParam = template.parameters.find(param => param.name === 'NAME');
    template.objects[0].metadata.name = nameParam.value;
    resolve(template);
  });

export const k8sCreate = (model, resource) => {
  if (model === ProcessedTemplatesModel) {
    return processTemplate(resource);
  }
  return new Promise(resolve => resolve(resource));
};

export default {
  component: NewVmWizard,
  props: {
    onHide: () => {},
    templates,
    namespaces,
    storageClasses,
    storages,
    k8sCreate
  }
};
