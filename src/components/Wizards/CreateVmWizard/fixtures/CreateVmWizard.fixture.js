import { CreateVmWizard } from '..';
import {
  templates,
  namespaces,
  k8sCreate,
  storages,
  storageClasses
} from '../../NewVmWizard/fixtures/NewVmWizard.fixture';

export default {
  component: CreateVmWizard,
  props: {
    onHide: () => {},
    templates,
    namespaces,
    storages,
    storageClasses,
    k8sCreate
  }
};
