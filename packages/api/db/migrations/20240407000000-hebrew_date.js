'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await queryInterface.createTable('hebrew_dates', {
      uuid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'), // Use PostgreSQL's UUID function
      },
      gregorian: {
        type: Sequelize.DATEONLY
      },
      dd: {
        type: Sequelize.INTEGER
      },
      mm: {
        type: Sequelize.INTEGER
      },
      yy: {
        type: Sequelize.INTEGER
      },
      rd: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Use PostgreSQL's CURRENT_TIMESTAMP for default value
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Use PostgreSQL's CURRENT_TIMESTAMP for default value
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hebrew_dates');
  }
};
