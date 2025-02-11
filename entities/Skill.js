const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Skill',
  tableName: 'SKILL',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 50,
      unique: true,
      nullable: false,
    },
    created_at: {
      type: 'timestamptz',
      createDate: true,
      nullable: false,
    },
  },
});
