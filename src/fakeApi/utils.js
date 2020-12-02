import { Serializer } from 'miragejs';

let paginatedResponse = (data) => {
  return {
    count: 2,
    next: null,
    previous: null,
    results: data.models ? data.models : data,
  };
};

let updateIfDoesntHave = function (model, keyValues, value) {
  // By default, assume keyValues is a dictonary of key value pairs
  if (keyValues instanceof String) {
    keyValues = {
      [keyValues]: value,
    };
  }
  let updateObj = {};
  Object.keys(keyValues).forEach((key) => {
    if (!model[key] || model[key].length == 0) {
      value = keyValues[key];
      if (typeof value === 'function') value = value();
      updateObj[key] = value;
    }
  });
  model.update(updateObj);
};

let RelationshipSerializer = (relationships) =>
  DefaultSerializer.extend({
    embed: true,
    include: relationships,
  });

let DefaultSerializer = Serializer.extend({
  root: false,
});

export {
  paginatedResponse,
  updateIfDoesntHave,
  RelationshipSerializer,
  DefaultSerializer,
};
