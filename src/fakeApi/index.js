import { createServer } from 'miragejs';

import { DefaultSerializer } from './utils';

import ProductionInterface from './production.model';
import PerformanceInterface from './performance.model';
import SocietyInterface from './society.model';
import CastInterface from './cast.model';
import CrewInterface from './crew.model';
import ProductionTeamInterface from './productionTeam.model';
import VenueInterface from './venue.model';

let apiModels = [
  ProductionInterface,
  PerformanceInterface,
  SocietyInterface,
  CastInterface,
  CrewInterface,
  ProductionTeamInterface,
  VenueInterface,
];

let models = {};
let serializers = {};
let factories = {};

export function makeServer({ environment = 'development' } = {}) {
  apiModels.forEach((model) => {
    models = Object.assign(models, model.registerModels());
    serializers = Object.assign(serializers, model.registerSerializers());
    factories = Object.assign(factories, model.registerFactories());
  });

  return createServer({
    environment,

    models: Object.assign({}, models),

    serializers: Object.assign({}, serializers),

    factories: Object.assign(
      {
        application: DefaultSerializer,
      },
      factories
    ),

    seeds(server) {
      let dramsoc = server.create('society', {
        name: 'Dramsoc',
        logo_image: null,
      });

      server.create('production', {
        name: 'Legally Blonde',
        society: server.create('society', {
          name: 'MTB',
        }),
        performances: server.createList('performance', 3),
      });

      server.create('production', {
        name: 'TRASh',
        subtitle: 'The Really Artsy Show',
        society: dramsoc,
        start_date: '2020-11-19',
        end_date: '2020-11-19',
        performances: server.createList('performance', 1),
      });

      server.create('production', {
        name: 'Present Laughter',
        society: dramsoc,
      });

      server.create('production', {
        name: 'A Default Production',
      });
    },

    routes() {
      this.namespace = 'api';

      apiModels.forEach((model) => {
        model.registerRoutes.bind(this)();
      });
    },
  });
}