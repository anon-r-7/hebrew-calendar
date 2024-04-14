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
      short_name: {
        type: Sequelize.STRING
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
      }
    });

    await queryInterface.bulkInsert('hebrew_events', [
      { 
        name: 'Shabbat',
        short_name: 'shabbat',
      },
      { 
        name: 'Pesach',
        short_name: 'pesach',
      },
      { 
        name: 'Chag HaMatzot',
        short_name: 'matzot',
      },
      { 
        name: 'Yom HaBikkurim',
        short_name: 'yom_bikkurim',
      },
      { 
        name: 'Chag Shavuot',
        short_name: 'shavuot',
      },
      { 
        name: 'Yom Teruah',
        short_name: 'yom_teruah',
      },
      { 
        name: 'Yom Kippur',
        short_name: 'yom_kippur',
      },
      { 
        name: 'Chag HaSukkot',
        short_name: 'sukkot',
      },
      { 
        name: 'Rosh Chodesh',
        short_name: 'rosh_chodesh',
      },
      { 
        name: 'Shabbat Shmita',
        short_name: 'shabbat_shmita',
      },
      { 
        name: 'Shnat HaYovel',
        short_name: 'shnat',
      },
      { 
        name: 'Yamin Noraim',
        short_name: 'yamin_noraim',
      },
      { 
        name: 'Chanukkah',
        short_name: 'chanukkah',
      },
      { 
        name: 'Purim',
        short_name: 'purim',
      },
      { 
        name: 'Tisha B\'Av',
        short_name: 'tisha_bav',
      },
    ])

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hebrew_events');
  }
};
