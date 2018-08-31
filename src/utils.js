export function prefixedId(idPrefix, id) {
  return idPrefix && id ? `${idPrefix}-${id}` : null;
}

export const getSequence = (from, to) => Array.from({ length: to - from + 1 }, (v, i) => i + from);

export const isMinus = keyCode => {
  switch (keyCode) {
    case KEY_CODES.HYPHEN_MINUS:
    case KEY_CODES.MINUS:
    case KEY_CODES.NUMPAD.SUBTRACT:
      return true;
    default:
      return false;
  }
};

export const KEY_CODES = {
  BACKSPACE: 8,
  SHIFT: 16,
  LEFT_KEY: 37,
  RIGHT_KEY: 39,
  DELETE_KEY: 46,
  0: 48,
  1: 49,
  9: 57,
  NUMPAD: {
    0: 96,
    1: 97,
    9: 105,
    SUBTRACT: 109
  },
  HYPHEN_MINUS: 173,
  MINUS: 189
};

export const INPUT_NAVIGATION_KEYS = [
  KEY_CODES.BACKSPACE,
  KEY_CODES.SHIFT,
  KEY_CODES.LEFT_KEY,
  KEY_CODES.RIGHT_KEY,
  KEY_CODES.DELETE_KEY
];

export const setNativeValue = (element, value) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
};
