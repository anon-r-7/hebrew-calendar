'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // type = 'rise' | 'meridian' | 'set' | 'newmoon' | 'firstquarter' | 'fullmoon' | 'thirdquarter'
      await queryInterface.createTable('moon', {
        uuid: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('uuid_generate_v4()'),
        },
        gregorian: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        hour: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        min: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        sec: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        azimuth: {
          type: Sequelize.DECIMAL(12, 1),
          allowNull: true,
        },
        altitude: {
          type: Sequelize.DECIMAL(12, 1),
          allowNull: true,
        },
        distance: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        illuminated: {
          type: Sequelize.DECIMAL(12, 1),
          allowNull: true,
        },
        posangle: {
          type: Sequelize.DECIMAL(12, 1),
          allowNull: true,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    } catch (error) {
      console.error('db migration error moon', error)
    }

    try {
      // type = 'antimeridian' | 'twi18_start' | 'twi12_start' | 'twi6_start' | 'rise' | 'meridian' | 'set' | 'twi6_end' | 'twi12_end' | 'twi18_end'
      await queryInterface.createTable('sun', {
        uuid: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('uuid_generate_v4()'),
        },
        gregorian: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        hour: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        min: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        sec: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        azimuth: {
          type: Sequelize.DECIMAL(12, 1),
          allowNull: true,
        },
        altitude: {
          type: Sequelize.DECIMAL(12, 1),
          allowNull: true,
        },
        distance: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });    } catch (error) {
      console.error('db migration error sun', error)
    }

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hebrew_event_dates');
  },
};
