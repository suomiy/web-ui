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

export const namespaces = [
  {
    name: 'default'
  },
  {
    name: 'myproject'
  }
];

export const flavors = [
  {
    name: 'Flavor1'
  },
  {
    name: 'Flavor2'
  }
];

export const workloadProfiles = [
  {
    id: 'profile-one',
    name: 'WorkloadProfile1',
    description: 'profile description'
  },
  {
    id: 'profile-two',
    name: 'WorkloadProfile2',
    description: 'profile description'
  }
];

export const templates = [
  {
    name: 'Template1'
  },
  {
    name: 'Template2'
  }
];
