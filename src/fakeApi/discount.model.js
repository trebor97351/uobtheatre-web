import faker from 'faker';
import { Factory } from 'miragejs';

import { updateIfDoesntHave } from './utils';

export default {
  registerFactories() {
    return {
      discountNode: Factory.extend({
        name: () =>
          faker.random.arrayElement([
            'Group Discount',
            'Family Discount',
            'Mates Rate Discount',
          ]),
        percentage: () => faker.random.float({ max: 0.5, min: 0 }),
      }),
      discountRequirementNode: Factory.extend({
        number: () => faker.random.number({ min: 1, max: 10 }),

        afterCreate(booking, server) {
          updateIfDoesntHave(booking, {
            concessionType: () => {
              return server.create('concessionTypeNode');
            },
          });
        },
      }),
    };
  },
  registerGQLTypes() {
    return `
      type DiscountNode implements Node {
        id: ID!
        name: String!
        percentage: Float!
        seatGroup: SeatGroupNode
        requirements: [DiscountRequirementNode]
      }

      type DiscountRequirementNode implements Node {
        id: ID!
        number: Int!
        concessionType: ConcessionTypeNode!
      }
    `;
  },
};