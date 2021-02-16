import faker from 'faker';
import lo from 'lodash';
import { belongsTo, Factory, Model } from 'miragejs';

import { authedUser, updateIfDoesntHave } from './utils';

export default {
  registerModels() {
    return {
      miscCostNode: Model.extend({
        production: belongsTo('productionNode'),
      }),
    };
  },
  registerFactories() {
    return {
      bookingNode: Factory.extend({
        bookingReference: () => faker.random.uuid(),
        status: 'IN_PROGRESS',
        afterCreate(node, server) {
          updateIfDoesntHave(node, {
            performance: () => {
              return server.create('performanceNode');
            },
          });
        },
      }),
      ticketNode: Factory.extend({
        afterCreate(booking, server) {
          updateIfDoesntHave(booking, {
            seatGroup: () => {
              return server.create('seatGroupNode');
            },
            concessionType: () => {
              return server.create('concessionTypeNode');
            },
          });
        },
      }),
      miscCostNode: Factory.extend({
        name: () =>
          faker.random.arrayElement([
            'Theatre Improvement Levy',
            'Booking Fee',
          ]),
        description: () => faker.lorem.words(5),
        percentage: () => faker.random.arrayElement([null, 0.05]),
        value: () => faker.random.number({ min: 50, max: 400 }),
      }),
    };
  },
  registerRoutes() {
    // Booking resource endpoints
    this.resource('bookings', { except: ['create', 'update'] });
    this.post('bookings', function (schema, request) {
      request.requestBody = JSON.stringify({
        booking: JSON.parse(request.requestBody),
      });
      let attrs = this.normalizedRequestAttrs('booking');
      return schema.bookings.create(attrs);
    });
    this.put('bookings/:id', function (schema, request) {
      request.requestBody = JSON.stringify({
        booking: JSON.parse(request.requestBody),
      });
      let attrs = this.normalizedRequestAttrs('booking');
      return schema.bookings.find(request.params.id).update(attrs);
    });
  },
  registerGQLMutationResolvers() {
    return {
      createBooking(obj, args, context) {
        // Create the tickets
        let tickets = [];
        if (args.tickets) {
          tickets = args.tickets.map((ticket) =>
            context.mirageSchema.create('ticketNode', {
              seatGroupId: ticket.seatGroupId,
              concessionTypeId: ticket.concessionTypeId,
            })
          );
        }

        // Create the booking
        let booking = context.mirageSchema.create('bookingNode', {
          performance: context.mirageSchema.performanceNodes.find(
            args.performanceId
          ),
          status: 'IN_PROGRESS',
          bookingReference: faker.random.uuid(),
          tickets: tickets,
          user: authedUser(context),
        });

        booking.update({
          priceBreakdown: context.mirageSchema.create(
            'priceBreakdownNode',
            generatePriceBreakdown(context.mirageSchema, booking)
          ),
        });

        return booking;
      },
      updateBooking(obj, args, { mirageSchema }) {
        // Update the tickets
        let tickets = [];
        if (args.tickets) {
          tickets = args.tickets.map((ticket) => {
            if (ticket.id) {
              return mirageSchema.ticketNodes.find(ticket.id);
            }
            return mirageSchema.create('ticketNode', {
              seatGroupId: ticket.seatGroupId,
              concessionTypeId: ticket.concessionTypeId,
            });
          });
        }
        // Update the booking
        let booking = mirageSchema.bookingNodes.find(args.id);
        booking.update({
          tickets: tickets,
        });
        booking.priceBreakdown.update(
          generatePriceBreakdown(mirageSchema, booking)
        );

        return booking;
      },
    };
  },
  registerGQLQueries() {
    return `
      booking(id: ID!): BookingNode
    `;
  },
  registerGQLTypes() {
    return `
      input CreateTicketInput {
        id: ID
        seatGroupId: ID!
        concessionTypeId: ID!
      }
      
      type BookingNode implements Node {
        id: ID!
        bookingReference: UUID!
        performance: PerformanceNode!
        status: BookingStatus!
        priceBreakdown: PriceBreakdownNode

        
        tickets: [TicketNode]
        user: UserNode
      }

      type PriceBreakdownNode implements Node {
        id: ID!
        tickets: [PriceBreakdownTicketNode]
        ticketsPrice: Int
        discountsValue: Int
        miscCosts: [MiscCostNode]
        subtotalPrice: Int
        miscCostsValue: Int
        totalPrice: Int

        
        ticketsDiscountedPrice: Int
      }

      type TicketNode {
        id: ID!
        seatGroup: SeatGroupNode!
        concessionType: ConcessionTypeNode!
      }

      type PriceBreakdownTicketNode {
        ticketPrice: Int
        number: Int
        seatGroup: SeatGroupNode
        totalPrice: Int

        
        concessionType: ConcessionTypeNode
      }

    `;
  },
  registerGQLMutations() {
    return `
      createBooking(performanceId: ID!, tickets: [CreateTicketInput]) : BookingNode
      updateBooking(id: ID!, tickets: [CreateTicketInput]) : BookingNode
    `;
  },
};

/**
 * @param {any} mirageSchema MirageJS Schema Instance
 * @param {object} booking MirageJS Booking Child
 * @returns {object} PriceBreakdownNode Data
 */
export function generatePriceBreakdown(mirageSchema, booking) {
  let performance = booking.performance;

  let ticketSummaries = lo
    .chain(booking.tickets.models)
    .groupBy((ticket) => [ticket.seatGroup.id, ticket.concessionType.id])
    .values()
    .map((groupedTickets) => {
      let ticketOption = performance.ticketOptions.models.find((option) => {
        return option.seatGroupId == groupedTickets[0].seatGroup.id;
      });
      let concessionTypeEdge = ticketOption.concessionTypes.models.find(
        (concessionTypeEdge) => {
          return (
            concessionTypeEdge.concessionTypeId ==
            groupedTickets[0].concessionType.id
          );
        }
      );

      return mirageSchema.create('priceBreakdownTicketNode', {
        number: groupedTickets.length,
        concessionType: concessionTypeEdge.concessionType,
        seatGroup: ticketOption.seatGroup,
        ticketPrice: concessionTypeEdge.price,
        totalPrice: concessionTypeEdge.price * groupedTickets.length,
      });
    })
    .value();

  let ticket_price = ticketSummaries
    .map((tickets) => tickets.totalPrice)
    .reduce((a, b) => a + b, 0);

  // A bit of a bodge...
  let discounts_price = performance.discounts.models.length
    ? Math.round(performance.discounts.models[0].percentage * 100)
    : 0;

  let tickets_inc_discount_price = ticket_price - discounts_price;

  let misc_costs = mirageSchema.miscCostNodes.where({
    productionId: performance.production.id,
  });
  misc_costs.models.forEach((misc_cost) => {
    if (misc_cost.percentage) {
      misc_cost.update({
        value: Math.round(misc_cost.percentage * tickets_inc_discount_price),
      });
    }
  });

  let misc_costs_price = misc_costs.models.length
    ? misc_costs.models
        .map((misc_cost) => misc_cost.value)
        .reduce((a, b) => a + b)
    : 0;

  let result = {
    // Tickets
    tickets: ticketSummaries,
    ticketsPrice: ticket_price,
    ticketsDiscountedPrice: tickets_inc_discount_price,
    discountsValue: discounts_price,

    // Misc Costs
    miscCosts: misc_costs,
    miscCostsValue: misc_costs_price,

    // Totals
    subtotalPrice: tickets_inc_discount_price,
    totalPrice: tickets_inc_discount_price + misc_costs_price,
  };

  return result;
}
