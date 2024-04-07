'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hebrew_events', {
      uuid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'), 
      },
      name: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });

    await queryInterface.bulkInsert('hebrew_events', [
      { name: 'Shabbat' },
      { name: 'Chag HaMatzot' },
      { name: 'Yom HaBikkurim' },
      { name: 'Chag Shavuot' },
      { name: 'Yom Teruah' },
      { name: 'Yom Kippur' },
      { name: 'Chag HaSukkot' },
      { name: 'Rosh Chodesh' },
      { name: 'Shabbat Shmita' },
      { name: 'Shnat HaYovel' },
      { name: 'Yamin Noraim' },
      { name: 'Chanukkah' },
      { name: 'Purim' },
      { name: 'Tisha B\'Av' },
    ])

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hebrew_events');
  }
};
