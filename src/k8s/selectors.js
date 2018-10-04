import { get, has } from 'lodash';
import { CUSTOM_FLAVOR, TEMPLATE_FLAVOR_LABEL, TEMPLATE_OS_LABEL, TEMPLATE_WORKLOAD_LABEL } from '../constants';
import { getTemplatesLabelValues, getTemplatesWithLabels } from '../utils/template';

export const getLabel = (basicSettings, labelPrefix, value) =>
  has(basicSettings, value) ? `${labelPrefix}/${get(basicSettings, [value, 'value'])}` : undefined;

export const getWorkloadLabel = basicSettings => getLabel(basicSettings, TEMPLATE_WORKLOAD_LABEL, 'workloadProfile');
export const getOsLabel = basicSettings => getLabel(basicSettings, TEMPLATE_OS_LABEL, 'operatingSystem');

export const getOperatingSystems = (basicSettings, templates) => {
  const templatesWithLabels = getTemplatesWithLabels(templates, [
    getWorkloadLabel(basicSettings),
    getFlavorLabel(basicSettings)
  ]);
  return getTemplatesLabelValues(templatesWithLabels, TEMPLATE_OS_LABEL);
};

export const getWorkloadProfiles = (basicSettings, templates) => {
  const templatesWithLabels = getTemplatesWithLabels(templates, [
    getOsLabel(basicSettings),
    getFlavorLabel(basicSettings)
  ]);
  return getTemplatesLabelValues(templatesWithLabels, TEMPLATE_WORKLOAD_LABEL);
};

export const getFlavorLabel = basicSettings => {
  if (has(basicSettings, 'flavor.value')) {
    const flavorValue = basicSettings.flavor.value;
    if (flavorValue !== CUSTOM_FLAVOR) {
      return `${TEMPLATE_FLAVOR_LABEL}/${basicSettings.flavor.value}`;
    }
  }
  return undefined;
};

export const getFlavors = (basicSettings, templates) => {
  const templatesWithLabels = getTemplatesWithLabels(templates, [
    getWorkloadLabel(basicSettings),
    getOsLabel(basicSettings)
  ]);
  const flavors = getTemplatesLabelValues(templatesWithLabels, TEMPLATE_FLAVOR_LABEL);
  flavors.push(CUSTOM_FLAVOR);
  return flavors;
};

export const getChosenTemplateAnnotations = (basicSettings, name) =>
  get(basicSettings.chosenTemplate.metadata.annotations, [name]);
